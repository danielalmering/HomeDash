import Vue from 'vue';
import jsmpeg from 'jsmpeg';

import {Component, Watch} from 'vue-property-decorator';
import {Route} from 'vue-router';
import {PaymentType, SessionType, State} from '../../../models/Sessions';
import Chat from './chat/chat';
import Jsmpeg from './streams/jsmpeg';
import {Rtmp as RTMPPlay} from './streams/rtmp';
import {Rtmp as RTMPBroadcast} from './broadcast/rtmp';
import NanoCosmos from './streams/nanocosmos';
import {WebRTC as WRTCPlay} from './streams/webrtc';
import {WebRTC as WRTCBroadcast} from './broadcast/webrtc'
import Confirmations from '../../layout/Confirmations.vue';
import {Devices, VideoCodec} from 'typertc';

import './videochat.scss';
import WithRender from './videochat.tpl.html';
import {RawLocation} from 'vue-router/types/router';
import {
    isApple,
    isIOS, isIOSNanoCosmos,
    isIPhone, isSafari,
    isWebrtcMuted,
    NanoCosmosPossible,
    noFlash,
    openModal,
    tagHotjar,
    webrtcPossible,
    webrtcPublishPossible,
    isIE
} from '../../../util';
import {Performer} from 'sensejs/performer/performer.model';
import {addFavourite, removeFavourite} from 'sensejs/performer/favourite';
import {clientSeen} from 'sensejs/session/index';
//import { webrtcPossible, noFlash } from 'sensejs/util/platform';
import {addSubscriptions, removeSubscriptions} from 'sensejs/performer/subscriptions';
import { S_IFREG } from 'constants';

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
        nanocosmos: NanoCosmos,
        confirmation: Confirmations,
        rtmpBroadcast: RTMPBroadcast,
        webrtcBroadcast: WRTCBroadcast,
    }
})
export default class VideoChat extends Vue {

    //Data
    isEnding: boolean = false;

    intervalTimer: number;
    mutedClass:string = "";

    broadcasting: BroadcastConfiguration = {
        cam: false,
        mic: false,
        settings: false,
        videoCodec: VideoCodec.H264
    };

    stateMessages: string[] = [];

    cameras: {id:string, name: string, selected: boolean}[];
    microphones: {id:string, name: string, selected: boolean}[];

    askToLeave:boolean = false;
    openModal = openModal;

    navigation: {
        to:Route, from:Route, next:(yes?:boolean | RawLocation)=>void
    }

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


    get isWebRTCPerformer(): boolean {
        //disable webrtc play by returning false here!

        if(this.performer == null){
            return false;
        }

        if(!this.performer && this.performer === undefined){
            return false;
        }

        if(!this.performer.mediaId  && this.performer.mediaId === undefined){
            return false;
        }

        return this.performer.mediaId > 1;
    }

    get streamTransportType(): string | undefined{
        if (!this.$store.state.session.activeSessionData){
            return undefined;
        }

        const playStream =  this.playStream;
        const platform = Platform.parse(navigator.userAgent);

        // OLD CODE
        // if webrtc is possible use webrtc viewer, nanocosmos, rtmp or jsmpeg
        /*if (this.isWebRTCPerformer && webrtcPossible(platform)){            
            return 'webrtc';            
        }

        // else use nanocosmos if you are an ios 10 or higher device (no sound problem here)
        if(NanoCosmosPossible(platform)) {
            return this.sessionType == SessionType.Peek ? 'nanocosmos' : 'jsmpeg';            
        }

        //old IE browsers
        if(isIE(platform)) {
            return 'rtmp';
        }

        // fallback on nanocosmos
        return 'jsmpeg';*/

        // let mediaid = this.performer.mediaId;
        // if(mediaid && mediaid === 2 && !webrtcPossible(platform)){ mediaid = 1 }
        // if(mediaid && mediaid === 3 && !NanoCosmosPossible(platform)){ mediaid = 1 }

        // switch (mediaid) {
        //     case 0:
        //         return 'jsmpeg';
        //         break;
        //     case 1:
        //         return 'jsmpeg';
        //         break;
        //     case 2:
        //         return 'webrtc';
        //         break;
        //     case 3:
        //         return 'nanocosmos';
        //         break;
        //     default:
        //         return 'jsmpeg';
        //         break;
        // }

        let mediaId = this.performer.mediaId;
        switch(mediaId) {
            //flash publisher
            case 0:
            case 1:
                return this.flashPublisher(platform);
            case 2: //webrtc publisher
                return this.webrtcPublisher(platform);
            case 3: // OBS publisher (clubsense streamer)
                return this.clubsenseStreamerPublisher(platform);
            default: //fallback encoder
                return 'jsmpeg';
        }
    }


    /**
     * Get the best player (encoder) for webrtc publishers
     * 
     * Publisher codec used:
     * 
     * video: h264
     * audio: PCMU 8kbit mono
     * 
     * Available codecs players:
     * 
     * - webrtc: (best match)
     *      video: h264, vp8 (limited), vp9 (limited)
     *      audio: opus,vorbis, pcmu, pcma
     *      quality: very high
     *      latency: 10ms - 500ms
     * 
     * - nanocosmos: (best match if no sound is used and webrtc is not a option)
     *      video: h264
     *      audio: aac
     *      quality: high
     *      latency: 700ms - 2000ms
     * 
     * - flash: (best match for IE browser who are still supporting Flash)
     *      video: h264
     *      audio: pcmu, pcma, aac 
     *      quality: very high
     *      latency: 10ms - 500ms    
     * 
     * - jsmpeg: (if all else fails , 'VHS' to the rescue)
     *      video: MPEG-1 (transcoded from h264 by server)
     *      audio: pcmu, pcma, aac
     *      quality: okish
     *      latency: 100ms - 800ms
     * 
     * @param platform parsed platform from browser useragent string     
     */
    private webrtcPublisher(platform: any){
        if(platform) {
            if(webrtcPossible(platform)){
                return 'webrtc';
            }

            if(NanoCosmosPossible(platform)){
                return this.sessionType == SessionType.Peek ? 'nanocosmos' : 'jsmpeg';
            }

            if(isIE(platform)) {
                return 'rtmp';
            }
        }

        //always default to jsmpeg
        return 'jsmpeg';
    }

    /**
     * Get the best player (encoder) for OBS (clubsense streamer) publishers
     *
     * Publisher codec used:
     *
     * video: h264
     * audio: AAC
     *
     * Available codecs players:
     *
     * 
     * - nanocosmos: (best match)
     *      video: h264
     *      audio: aac
     *      quality: high
     *      latency: 700ms - 2000ms
     * 
     * - webrtc: (best match, if no sound is needed)
     *      video: h264, vp8 (limited), vp9 (limited)
     *      audio: opus, vorbis, pcmu, pcma
     *      quality: very high
     *      latency: 10ms - 500ms
     *
     * - flash: (best match for IE browser who are still supporting Flash)
     *      video: h264
     *      audio: pcmu, pcma, aac
     *      quality: very high
     *      latency: 10ms - 500ms
     *
     * - jsmpeg: (if all else fails , 'VHS' to the rescue)
     *      video: MPEG-1 (transcoded from h264 by server)
     *      audio: pcmu, pcma, aac
     *      quality: okish
     *      latency: 100ms - 800ms
     *
     * @param platform parsed platform from browser useragent string
     */
    private clubsenseStreamerPublisher(platform: any) {
        if(platform) {
            if (webrtcPossible(platform) && this.sessionType == SessionType.Peek) {
                return 'webrtc';
            }
            
            if(NanoCosmosPossible(platform)){
                return 'nanocosmos';
            }

            if(isIE(platform)){
                return 'rtmp';
            }
        }

        return 'jsmpeg';
    }

    /**
     * Get the best player (encoder) for Flash publishers (RTMP)
     *
     * Publisher codec used:
     *
     * video: h264
     * audio: pcmu
     *
     * Available codecs players:
     *
     * - nanocosmos: (best match if the is no sound needed)
     *      video: h264
     *      audio: aac
     *      quality: high
     *      latency: 700ms - 2000ms
     *
     * - flash: (best match for IE browser who are still supporting Flash)
     *      video: h264
     *      audio: pcmu, pcma, aac
     *      quality: very high
     *      latency: 10ms - 500ms
     *
     * - jsmpeg: (if all else fails , 'VHS' to the rescue)
     *      video: MPEG-1 (transcoded from h264 by server)
     *      audio: pcmu, pcma, aac
     *      quality: okish
     *      latency: 100ms - 800ms
     *
     * @param platform parsed platform from browser useragent string
     */
    private flashPublisher(platform: any){
        if(platform) {            
            if(NanoCosmosPossible(platform)) {
                return this.sessionType == SessionType.Peek ? 'nanocosmos' : 'jsmpeg';
            }

            if(isIE(platform)){
                return 'rtmp';
            }             
        }

        return 'jsmpeg';
    }

    get broadcastType():string{
        if (!this.userHasCam){
            return 'none';
        }

        if (this.sessionType == SessionType.Peek){
            return 'none';
        }

        const platform = Platform.parse(navigator.userAgent);

        //check if it is possible to publish with webrtc
        if (webrtcPublishPossible(platform)){
            //Begin apple fixes
            //Disable iphone for now
            if(isIPhone(platform)){
                return 'none';
            }

            //use vp8 if the browser is safari and above > 12.1
            if(isSafari(platform)){
                if(this.isWebRTCPerformer){ //performer needs to use the webrtc transport
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

        //disabled camback on mobile for now
        //move to below webrtcPossible, and those platforms that support webrtc will cam back.
        if (noFlash(platform)){
            return 'none';
        }

        return 'rtmpBroadcast';
    }

    get wowza(): string | undefined{
        if (!this.$store.state.session.activeSessionData){
            return undefined;
        }
        return this.$store.state.session.activeSessionData.wowza;
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

    get isSwitchModal(): boolean {
        return this.$store.state.session.isSwitchModal;
    }

    public userHasCam:boolean = false;

    private detectCam(){
        const platform = Platform.parse(navigator.userAgent);
        //apples always have cameras. can't count the # of cameras until I ask permission to use the cameras :-(
        if (isApple(platform)){
            this.userHasCam = true;
            return;
        }

        //if webrtc is not possible, we'll try to use flash to do the determining
        if (!webrtcPossible(platform)){
            this.userHasCam = true;
            return;
        }

        new Devices().getCameras().then( cams => this.userHasCam = cams.length > 0 );
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

    get canSwitchToVideoCall():boolean{
        //TODO: Look into this
        //There is an off chance in between changing peekers that there is no performer but this property gets triggered from a rerender or something
        //Only happens in peek so it shouldn't error here if we comment out this console.log
        //console.log(this.sessionType, this.paymentMethod, this.performer.performer_services.videocall);

        return (this.sessionType == SessionType.Video)
             &&
                (this.paymentMethod == PaymentType.Ivr)
            &&
                (this.performer.performer_services.videocall);
    }

    addSubscriptions = (performer: Performer) => addSubscriptions(this.$store.state.authentication.user.id, performer.id).then(() => {
        performer.isSubscribed = true
        if(!this.user.notification_mode){
            const loggedin = !this.authenticated ? this.openModal('login') : this.openModal('notifications');
        }
    });
    removeSubscriptions = (performer: Performer) => removeSubscriptions(this.$store.state.authentication.user.id, performer.id).then(() => performer.isSubscribed = false);

    mounted(){
        const self = this;

        if(this.$store.state.session.activeState !== State.Initializing){
            this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });

            return;
        }

        const sessionData = this.$store.state.session.activeSessionData;

        if(!sessionData){
            return;
        }

        this.$store.watch((state) => state.session.activeState, (newValue: State) => {
            if(newValue === State.Ending && !this.isEnding){
                this.close();
            }
        });

        this.intervalTimer = window.setInterval(async () => {
            const { error } = await clientSeen();

            if(error && !this.isSwitching){
                this.close();
            }
        }, 5000);

        this.detectCam();
    }

    close(){
        this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });
    }

    toggleFavourite(){
        !this.performer.isFavourite ?
            addFavourite(this.$store.state.authentication.user.id, this.performer.id) :
            removeFavourite(this.$store.state.authentication.user.id, this.performer.id);

        this.performer.isFavourite = !this.performer.isFavourite;
    }

    async gotoVoyeur(next:(yes?:boolean | RawLocation)=>void){
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
            //logKPI("cl_cambackintention");
        }

        tagHotjar(`TOGGLE_CAM`);
    }

    toggleMic(){
        this.broadcasting.mic = !this.broadcasting.mic;
        //replace the boolean with the actual name if the selected mic is showing..
        if (this.broadcasting.settings && this.broadcasting.mic){
            const selected = this.microphones.find(mic => mic.selected);
            if (selected){
                console.log("nu is alles anders!");
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
        if (state == 'active'){
            //logKPI("cl_camback_active");
        }
    }

    broadcastError(message: string){
        this.stateMessages.push(message);
        //logKPI("cl_camback_error");
    }

    viewerStateChange(state: string){
        if (state === 'active'){
            this.$store.dispatch('setActive');
        }

        if (state === 'disconnected'){
            this.$store.dispatch('disconnected');
        }
    }

    viewerError(message: string){
        console.log(message);

    }

    toggleSettings(){
        this.broadcasting.settings = !this.broadcasting.settings;
        //go get the list of devices if the "settings" will toggle to visible
        if (this.broadcasting.settings){
            const flash: any = this.$el.querySelector('#broadcastSWF') as any;

            if (flash){
                this.cameras = flash.getCameras();
                this.cameras.forEach(cam=>cam.id = cam.name);

                let selected = this.cameras.find(cam => cam.selected);
                if (selected && this.broadcasting.cam !== selected.id){
                    this.broadcasting.cam = selected.id;
                }

                this.microphones = flash.getMicrophones();
                this.cameras.forEach(mic=>mic.id = mic.name);
                selected = this.microphones.find(mic => mic.selected);
                if (selected && this.broadcasting.mic && this.broadcasting.mic !== selected.id){
                    this.broadcasting.mic = selected.id;
                }
            } else {
                const devices = new Devices();
                devices.getCameras().then( cams => {
                    this.cameras=cams;
                    let selected = this.cameras.find(cam=>cam.selected);
                    if (selected && this.broadcasting.cam !== selected.id){
                        this.broadcasting.cam = selected.id;
                    }
                });
                devices.getMicrophones().then( mics => {
                    this.microphones=mics;
                    let selected = this.microphones.find(mic=>mic.selected);
                    if(selected && this.broadcasting.mic && this.broadcasting.mic !== selected.id){
                        this.broadcasting.mic = selected.id;
                    }
                });
            }
        }
    }

    get activeState(): State {
        return this.$store.state.session.activeState;
    }

    public beforeRouteLeave(to:Route, from:Route, next:(yes?:boolean | RawLocation)=>void){
        const autoLeaves = [ State.Canceling, State.Ending, State.Idle ];

        if(this.isSwitching){
            return;
        }

        if (autoLeaves.indexOf(this.activeState) > -1 || to.name === 'Voyeur' || to.name === 'Videochat' || to.name === 'Peek'){
            if(this.$store.state.session.fromVoyeur && to.name !== 'Voyeur'){
                return this.gotoVoyeur(next);
            }

            return next();
        }

        this.navigation = {to, from, next};
        this.askToLeave = true;
    }

    @Watch('activeState') async onSessionStateChange(value:State, oldValue:State){
        if (value === State.Accepted){
            //console.log("Get new data :)");
            await this.$store.dispatch('initiate');
            //console.log("for reeels");

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
        }

        this.$store.commit('toggleSwitchModal', { state: false });

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
        this.askToLeave = false;

        if(this.$store.state.session.fromVoyeur){
            return this.gotoVoyeur(this.navigation.next);
        }

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
