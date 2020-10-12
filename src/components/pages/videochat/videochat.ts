import Vue from 'vue';

import {Component, Watch} from 'vue-property-decorator';
import {Route} from 'vue-router';
import {PaymentType, SessionType, State} from '../../../models/Sessions';
import Chat from './chat/chat';
import Jsmpeg from './streams/jsmpeg';
import {Rtmp as RTMPPlay} from './streams/rtmp';
import {Rtmp as RTMPBroadcast} from './broadcast/rtmp';
import NanoCosmos from './streams/nanocosmos';
import {WebRTC as WRTCPlay} from './streams/webrtc';
import {WebRTC as WRTCBroadcast} from './broadcast/webrtc';
import { JanusPlay } from './streams/janus';
import { JanusCast } from './broadcast/janus';
import Confirmations from '../../layout/confirmations/confirmations';
import {Devices, VideoCodec} from 'typertc';
import config from '../../../config';

import './videochat.scss';
import WithRender from './videochat.tpl.html';
import {RawLocation} from 'vue-router/types/router';
import { openModal, openTab, tagHotjar, hasService, setKPI } from '../../../utils/main.util';
import {
    isWebRTCPerformer,
    isApple,
    isIOS, isIOSNanoCosmos,
    isIPhone, isSafari,
    isWebrtcMuted,
    NanoCosmosPossible,
    noFlash,
    webrtcPossible,
    webrtcPublishPossible,
    isIE
} from '../../../utils/video.util';
import {Performer} from 'sensejs/performer/performer.model';
import {addFavourite, removeFavourite} from 'sensejs/performer/favourite';
import {clientSeen} from 'sensejs/session/index';
import {addSubscriptions, removeSubscriptions} from 'sensejs/performer/subscriptions';
import { webrtcPublisher, flashPublisher, clubsenseStreamerPublisher, janusPublisher } from '../videochat/videochat.publishers';
import notificationSocket from '../../../socket';
import { UserRole } from '../../../models/User';

const Platform = require('platform');
//import Platform from 'platform';

interface BroadcastConfiguration {
    cam: boolean | string;
    mic: boolean | string;
    settings: boolean;
    videoCodec: VideoCodec;
}

Component.registerHooks([
    'beforeRouteEnter',
    'beforeRouteLeave',
    'beforeRouteUpdate'
]);

@WithRender
@Component({
    components: {
        chat: Chat,
        jsmpeg: Jsmpeg,
        rtmp: RTMPPlay,
        webrtc: WRTCPlay,
        janus: JanusPlay,
        nanocosmos: NanoCosmos,
        confirmation: Confirmations,
        rtmpBroadcast: RTMPBroadcast,
        webrtcBroadcast: WRTCBroadcast,
        janusBroadcast: JanusCast
    }
})
export default class VideoChat extends Vue {

    //Data
    isEnding: boolean = false;

    intervalTimer: number;
    mutedClass: string = '';

    broadcasting: BroadcastConfiguration = {
        cam: false,
        mic: false,
        settings: false,
        videoCodec: VideoCodec.H264
    };

    stateMessages: string[] = [];

    cameras: {id: string, name: string, selected: boolean}[] = [];
    microphones: {id: string, name: string, selected: boolean}[] = [];

    askToLeave: boolean = false;
    openModal = openModal;
    openTab = openTab;

    navigation: {
        to: Route, from: Route, next: (yes?: boolean | RawLocation) => void
    };

    get authenticated(): boolean {
        return this.$store.getters.isLoggedIn;
    }

    get user(){
        return this.$store.state.authentication.user;
    }

    get sessionType(): SessionType{
        return this.$store.state.session.activeSessionType;
    }

    get paymentMethod(): string{
        return this.$store.state.session.activeIvrCode ? 'IVR' : 'CREDITS';
    }

    get currentState(){
        return this.$store.state.session.activeState;
    }

    get streamTransportType(): string | undefined{
        //return 'jsmpeg';

        if (!this.$store.state.session.activeSessionData){
            return undefined;
        }

        //check integerty
        if (!this.performer) {
            return undefined;
        }

        if (!this.performer.mediaId) {
            return undefined;
        }

        const platform = Platform.parse(navigator.userAgent);
        const mediaId = this.performer.mediaId;

        switch(mediaId) {
            //flash publisher
            case 0:
            case 1:
                return flashPublisher(platform, this.sessionType);
            case 2: //webrtc publisher
                return webrtcPublisher(platform, this.sessionType);
            case 3: // OBS publisher (clubsense streamer)
                return clubsenseStreamerPublisher(platform, this.sessionType);
            case 4:
                return janusPublisher(platform);
            default: //fallback encoder
                return 'jsmpeg';
        }
    }

    private _broadcastType: string  = 'none';

    get broadcastType(): string{
        if (this._broadcastType && this._broadcastType != 'none'){
            return this._broadcastType;
        }

        this._broadcastType = this.chooseBroadcastType();

        return this._broadcastType;
    }

    chooseBroadcastType(): string{
       // return 'rtmpBroadcast';

        if (!this.userHasCam){
            return 'none';
        }

        if (this.sessionType == SessionType.Peek){
            return 'none';
        }

        const platform = Platform.parse(navigator.userAgent);

        let janusPercentage = parseInt(this.$store.state.session.activeSessionData.streamJanusBackProc);
        //let janusPercentage = 100;
        if (janusPercentage < 0){
            janusPercentage = 0;
        } else if ( janusPercentage > 100){
            janusPercentage = 100;
        }

        //disallow janus when performer is using the streamer..
        const STREAMER = 3;
        if (this.performer.mediaId === STREAMER){
            janusPercentage = 0;
        }

        //check if it is possible to publish with webrtc
        if (webrtcPublishPossible(platform)){
            //iPhone only works with janus....
            if(isIPhone(platform)){
                return 'janusBroadcast';
            }
            //throw the dice to see if janus will be chosen as publisher
            if(Math.random() < (janusPercentage / 100)){
                return 'janusBroadcast';
            } else {

                //use vp8 if the browser is safari and above > 12.1
                if(isSafari(platform)){
                    if(isWebRTCPerformer(this.performer)){ //performer needs to use the webrtc transport
                        this.broadcasting.videoCodec = VideoCodec.VP8;
                    } else { //else old skool flash if available
                        if(noFlash(platform)) {
                            return 'none';
                        }

                        return 'rtmpBroadcast';
                    }
                }
                //end apple fixes

                return 'webrtcBroadcast';
            }

        }

        //disabled camback on mobile for now
        //move to below webrtcPossible, and those platforms that support webrtc will cam back.
        if (noFlash(platform)){
            return 'none';
        }

        return 'rtmpBroadcast';
    }

    get playServer(): string | undefined {
        if (!this.$store.state.session.activeSessionData){
            return undefined;
        }

        if (this.streamTransportType === 'janus'){
            return config.Janus;
        }

        if (this.streamTransportType === 'jsmpeg'){
            return this.performer.mediaId === 4 ? config.JanusmpegUrl : config.JsmpegUrl;
        }

        return this.$store.state.session.activeSessionData.wowza;
    }

    get castServer(): string | undefined {
        if (this._broadcastType == 'janusBroadcast'){
            return config.Janus;
        } else if (!this.$store.state.session.activeSessionData){
            return undefined;
        } else {
            return this.$store.state.session.activeSessionData.wowza;
        }
    }

    get publishStream(): string | undefined{
        if (!this.$store.state.session.activeSessionData){
            return undefined;
        }

        return this.$store.state.session.activeSessionData.publishStream;
    }

    get publishToken(): string | undefined{
        if (!this.$store.state.session.activeSessionData){
            return undefined;
        }
        return this.$store.state.session.activeSessionData.publishToken;
    }

    get playStream(): string | undefined{
        if (!this.$store.state.session.activeSessionData){
            return undefined;
        }
        return this.$store.state.session.activeSessionData.playStream;
    }

    get playToken() : string | boolean{
        if (!this.$store.state.session.activeSessionData){
            return false;
        }
        return this.$store.state.session.activeSessionData.playToken;
    }

    get isSwitchModal(): boolean {
        return this.$store.state.session.isSwitchModal;
    }

    public userHasCam: boolean = false;
    public userHasMic: boolean = false;

    private async detectDevices(){
        const platform = Platform.parse(navigator.userAgent);
        //apples always have cameras & mics. can't count the # of cameras until I ask permission to use the cameras :-(
        if (isApple(platform)){
            this.userHasCam = true;
            this.userHasMic = true;
            return;
        }

        //if webrtc is not possible, we'll try to use flash to do the determining
        if (!webrtcPossible(platform)){
            this.userHasCam = true;
            this.userHasMic = true;
            return;
        }

        const d = new Devices();
        const cams = await d.getCameras();
        this.userHasCam = cams.length > 0;
        const mics = await d.getMicrophones();
        this.userHasMic = mics.length > 0;
    }

    get performer(): Performer {
        return this.$store.state.session.activePerformer;
    }

    get displayName(){
        return this.$store.state.session.activeDisplayName;
    }

    get isSwitching(){
        return this.$store.state.session.isSwitching;
    }

    get activeState(): State {
        return this.$store.state.session.activeState;
    }

    get canSwitchToVideoCall(): boolean{
        //TODO: Look into this
        //There is an off chance in between changing peekers that there is no performer but this property gets triggered from a rerender or something
        //Only happens in peek so it shouldn't error here if we comment out this console.log
        //console.log(this.sessionType, this.paymentMethod, this.performer.performer_services.videocall);

        return (this.sessionType == SessionType.Video)
             &&
                (this.paymentMethod == PaymentType.Ivr)
            &&
                (hasService(this.performer, 'videocall'));
    }

    addSubscriptions = (performer: Performer) => addSubscriptions(this.$store.state.authentication.user.id, performer.id).then(() => {
        performer.isSubscribed = true;
        if(!this.user.notification_mode){
            const loggedin = !this.authenticated ? this.openModal('login') : this.openModal('notifications');
        }
    })
    removeSubscriptions = (performer: Performer) => removeSubscriptions(this.$store.state.authentication.user.id, performer.id).then(() => performer.isSubscribed = false);

    mounted(){

        if(this.$store.state.session.activeState !== State.Initializing){
            this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });

            return;
        }

        const sessionData = this.$store.state.session.activeSessionData;

        if(!sessionData){
            return;
        }

        this.detectDevices();
    }

    async close(){
        this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });
    }

    toggleFavourite(){
        !this.performer.isFavourite ?
            addFavourite(this.$store.state.authentication.user.id, this.performer.id) :
            removeFavourite(this.$store.state.authentication.user.id, this.performer.id);

        this.performer.isFavourite = !this.performer.isFavourite;
    }

    toggleClientSeen(){
        this.intervalTimer = window.setInterval(async () => {
            const { error } = await clientSeen();

            if(error && !this.isSwitching){
                this.close();
            }
        }, 5000);
    }

    async gotoVoyeur(next: (yes?: boolean | RawLocation) => void){
        try {
            await this.$store.dispatch('end', 'PLAYER_END');

            await this.$store.dispatch('voyeur/startVoyeur', {
                performerId: this.$store.state.session.activePerformer.id,
                ivrCode: this.$store.state.session.activeIvrCode,
                displayName: this.$store.state.session.displayName
            });

            next({
                name: 'Voyeur',
                params: {
                    id: this.$store.state.session.activePerformer.advertId.toString()
                }
            });
        } catch(ex){
            next();
        }
    }

    startCalling(){
        this.$store.dispatch('startCalling');
    }

    stopCalling(){
        this.$store.dispatch('stopCalling');
    }

    startCam(){
        this.broadcasting.cam = true;
    }

    toggleCam(){
        this.broadcasting.cam = !this.broadcasting.cam;

        //also hide the settings screen when the cam is turned off
        if (!this.broadcasting.cam){
            this.broadcasting.settings = false;
        }

        if (this.broadcasting.cam){
            //reset the stateMessages so the second intention will be counted correctly.
            this.stateMessages = [];
            setKPI('cl_camback_intention', {transport: this.broadcastType});
        }

        tagHotjar(`TOGGLE_CAM`);
    }

    toggleMic(){
        this.broadcasting.mic = !this.broadcasting.mic;
        //replace the boolean with the actual name if the selected mic is showing..
        if (this.broadcasting.settings && this.broadcasting.mic){
            const selected = this.microphones.find(mic => mic.selected);
            if (selected){
                this.broadcasting.mic = selected.id;
            }
        }

        tagHotjar(`TOGGLE_MIC`);
    }


    setCamera(event: Event){
        const camId = (<HTMLSelectElement>event.srcElement).value;
        this.cameras.forEach(cam => cam.selected = (cam.id === camId));
        this.broadcasting.cam = camId;
    }

    setMicrophone(event: Event){
        const micId = (<HTMLSelectElement>event.srcElement).value;
        this.microphones.forEach(mic => mic.selected = (mic.id === micId));
        this.broadcasting.mic = micId;
    }

    broadcastStateChange(state: string){
        this.stateMessages.push(state);
        let actives: string[] = [];
        if (state == 'active'){
            //make sure only the first time the state turns 'active', the active state is counted.
            actives = this.stateMessages.filter( msg => msg == 'active');
            if (actives.length == 1){
                setKPI('cl_camback_active');
            }
        }

         //some exceptions for Janus down here..
         if (this._broadcastType == 'janusBroadcast'){
            if (state == 'active' && actives.length == 1){
                //notify the performer this room is ready for camming back..
                // type: "ACTIVATED",
                // value: ""
                // data.clientType
                notificationSocket.sendEvent(
                    {
                        receiverType: UserRole.Performer,
                        receiverId: this.$store.state.session.activePerformer.id,
                        event: 'clientstream',
                        content: {
                            type: 'ACTIVATED',
                            value: null,
                            clientType: 'janus'
                        }
                    }
                );
            } else if (state == 'connected' ){
                //since there's no signaling of the media server to the client, notify a successfull connect here.. for compatibility's sake.
                setKPI('cl_camback_connected');
            }

         }

    }

    broadcastError(error: any){
        this.stateMessages.push(error);
        let msg = '';
        if( typeof error == 'string'){
            msg = error;
            setKPI('cl_camback_error', {message: error});
        } else if ('message' in error) {
            msg = error.message;
            setKPI('cl_camback_error', {message: error.message});
        } else if ('name' in error){
            msg = error.message;
            setKPI('cl_camback_error', {message: error.name});
        } else {
            msg = 'c2c-failed';
            setKPI('cl_camback_error');
        }

        //remove the smallscreen and set error when NOT flash
        if(this.broadcastType != 'rtmpBroadcast'){
            this.broadcasting.cam = false;

            if (error.name == 'NotAllowedError'){
                this.$store.dispatch('errorMessage', 'videochat.alerts.permission-denied');
            } else {
                this.$store.dispatch('errorMessage', msg);
            }
        }
    }

    viewerStateChange(state: string){
        console.log( `new state: ${state}` );
        if (state === 'active'){
            this.$store.dispatch('setActive');
        }

        if (state === 'disconnected'){
            //this.$store.dispatch('disconnected');
        }
    }

    viewerError(message: string){
        console.log(`error: ${message}`);
    }

    toggleSettings(){
        this.broadcasting.settings = !this.broadcasting.settings;
        //go get the list of devices if the "settings" will toggle to visible
        if (this.broadcasting.settings){
            const flash: any = this.$el.querySelector('#broadcastSWF') as any;

            if (flash){
                this.cameras = flash.getCameras();
                this.cameras.forEach(cam => cam.id = cam.name);

                let selected = this.cameras.find(cam => cam.selected);
                if (selected && this.broadcasting.cam !== selected.id){
                    this.broadcasting.cam = selected.id;
                }

                this.microphones = flash.getMicrophones();
                this.cameras.forEach(mic => mic.id = mic.name);
                selected = this.microphones.find(mic => mic.selected);
                if (selected && this.broadcasting.mic && this.broadcasting.mic !== selected.id){
                    this.broadcasting.mic = selected.id;
                }
            } else {
                const devices = new Devices();

                devices.getCameras().then( cams => {
                    this.cameras = cams;
                    const selected = this.cameras.find(cam => cam.selected);
                    if (selected && this.broadcasting.cam !== selected.id){
                        this.broadcasting.cam = selected.id;
                    }
                });

                //if (this.microphones.length == 0){
                    devices.getMicrophones().then( mics => {
                        this.microphones = mics;
                        const selected = this.microphones.find(mic => mic.selected);
                        if(selected && this.broadcasting.mic && this.broadcasting.mic !== selected.id){
                            this.broadcasting.mic = selected.id;
                        }
                    });
                //}
            }
        }
    }

    public beforeRouteLeave(to: Route, from: Route, next: (yes?: boolean | RawLocation) => void){
        const autoLeaves = [ State.Canceling, State.Ending, State.Idle ];

        if(this.isSwitching){
            return;
        }

        if (autoLeaves.indexOf(this.activeState) > -1 || to.name === 'Voyeur' || to.name === 'Videochat' || to.name === 'Peek'){
            if(this.$store.state.session.fromVoyeur && to.name !== 'Voyeur'){
                //return this.gotoVoyeur(next);
            }

            return next();
        }

        this.navigation = {to, from, next};
        this.askToLeave = true;
    }

    @Watch('currentState') async onStateChange(newValue: State, oldValue: State){
        // Ending/Starting State Changing
        if(newValue === State.Active){
            clearInterval(this.intervalTimer);
            this.toggleClientSeen();
        }
        if(newValue === State.Ending){
            clearInterval(this.intervalTimer);
        }
        if(newValue === State.Ending && !this.isEnding){
            this.close();
        }
    }

    @Watch('activeState') async onSessionStateChange(value: State, oldValue: State){
        if (value === State.Accepted){
            //console.log("Get new data :)");
            await this.$store.dispatch('initiate');
            //console.log("active state changed");

            if(this.navigation && this.navigation.next){
                this.navigation.next(true);
            }
        }
    }

    async switchPeek(){

        try {
            await this.$store.dispatch('switchPeek', this.$store.state.session.switchingPerformer);
        } catch(e){
            this.$store.dispatch('errorMessage', 'sidebar.alerts.errorSwitchFailed');
            //switch failed so disable switch modal
            this.$store.commit('toggleSwitchModal', { state: false });
            return;
        }

        this.$store.commit('toggleSwitchModal', { state: false });
        clearInterval(this.intervalTimer);

        this.$router.push({
            name: 'Peek',
            params: {
                id: this.$store.state.session.activePerformer.advertId.toString()
            }
        });
    }

    cancelSwitch(){
        this.$store.commit('toggleSwitchModal', { state: false });
    }

    async leave(){
        await this.$store.dispatch('end');
        this.askToLeave = false;

        // TODO: MAKE PERFORMER DATA IN STORE
        // if(this.$store.state.session.fromVoyeur){
        //     return this.gotoVoyeur(this.navigation.next);
        // }

        this.navigation.next();
    }

    stay(){
        this.askToLeave = false;
        this.navigation.next(false);
    }

    beforeDestroy(){
        this.isEnding = true;
        // Stop clientSeen event
        clearInterval(this.intervalTimer);
        // Trigger end
        this.$store.dispatch('end', 'PLAYER_END');
    }
}