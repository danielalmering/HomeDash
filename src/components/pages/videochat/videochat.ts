import Vue from 'vue';
import jsmpeg from 'jsmpeg';

import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { State, SessionType, PaymentType } from '../../../models/Sessions';
import { SessionData, RequestPayload } from '../../../store/Session/';

import notificationSocket from '../../../socket';
import Chat from './chat/chat';
import Broadcast from './broadcast/broadcast';
import Jsmpeg from './streams/jsmpeg';
import { Rtmp as RTMPPlay } from './streams/rtmp';
import { Rtmp as RTMPBroadcast } from './broadcast/rtmp';
import NanoCosmos from './streams/nanocosmos';
import { WebRTC as WRTCPlay } from './streams/webrtc';
import { WebRTC as WRTCBroadcast } from './broadcast/webrtc'
import config from '../../../config';
import Confirmations from '../../layout/Confirmations.vue';
import { Devices } from 'typertc';

import './videochat.scss';
import WithRender from './videochat.tpl.html';
import Page from '../page';
import { RawLocation } from 'vue-router/types/router';
import { tagHotjar, isApple } from '../../../util';
import { Performer } from 'sensejs/performer/performer.model';
import { addFavourite, removeFavourite } from 'sensejs/performer/favourite';
import { clientSeen } from 'sensejs/session/index';
import { webrtcPossible, noFlash } from 'sensejs/util/platform';
const Platform = require('platform');

interface BroadcastConfiguration {
    cam: boolean | string;
    mic: boolean | string;
    settings: boolean;
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
        webrtcBroadcast: WRTCBroadcast
    }
})
export default class VideoChat extends Vue {

    //Data
    isEnding: boolean = false;

    intervalTimer: number;

    broadcasting: BroadcastConfiguration = {
        cam: false,
        mic: false,
        settings: false
    };

    stateMessages: string[] = [];

    cameras: {id:string, name: string, selected: boolean}[];
    microphones: {id:string, name: string, selected: boolean}[];

    askToLeave:boolean = false;

    navigation: {
        to:Route, from:Route, next:(yes?:boolean | RawLocation)=>void
    }

    get sessionType(): SessionType{
        return this.$store.state.session.activeSessionType;
    }

    get paymentMethod(): string{
        return this.$store.state.session.activeIvrCode ? 'IVR' : 'CREDITS';
    }

    get streamTransportType(): string | undefined{
        if (!this.$store.state.session.activeSessionData){
            return undefined;
        }

        //Uncomment if you need the user to be able to watch using flash
        //playback using flash for devices that do not support webAudio (so devices that can't play sound in jsmpeg)
        //Peeking is mute, so no need for flash in that scenario.
        // if ( this.sessionType !== SessionType.Peek && !hasWebAudio() ){
        //     return 'rtmp';
        // }
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

        //disabled camback on mobile for now
        //move to below webrtcPossible, and those platforms that support webrtc will cam back.
        if (noFlash(platform)){
            return 'none';
        }

        if (webrtcPossible(platform)){
            return 'webrtcBroadcast';
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
        this.performer.isFavourite ?
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
            //logKPI("cl_camback_intention");
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
            await this.$store.dispatch('initiate');

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

        //Stop clientSeen event
        clearInterval(this.intervalTimer);
        //Send end API call and update state to ending
        if(this.$store.state.session.activeState !== State.Idle){
            console.log("ok, waarom destroyen??");
            this.$store.dispatch('end', 'PLAYER_END');
        }
    }
}
