import Vue from 'vue';
import jsmpeg from 'jsmpeg';

import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { State, SessionType } from '../../../models/Sessions';
import { SessionData, RequestPayload } from '../../../store/Session';

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
import Performer from '../performer';
import WithRender from './videochat.tpl.html';
import Page from '../page';
import { RawLocation } from 'vue-router/types/router';
import { webrtcPossible, noFlash } from '../../../util';
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

        // return this.$store.state.session.activeSessionData.streamTransportType.toLowerCase();
        return 'jsmpeg';
    }

    get broadcastType():string{
        if (this.sessionType == SessionType.Peek){
            return 'none';
        }

        var platform = Platform.parse(navigator.userAgent);
        if (webrtcPossible(platform)){
            return 'webrtcBroadcast';
        }
        if (noFlash(platform)){
            return 'none';
        }
        return 'flash';
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

    get playStream(): string | undefined{
        if (!this.$store.state.session.activeSessionData){
            return undefined;
        }
        return this.$store.state.session.activeSessionData.playStream;
    }

    get performer(){
        return this.$store.state.session.activePerformer;
    }

    get displayName(){
        return this.$store.state.session.activeDisplayName;
    }

    get isSwitching(){
        return this.$store.state.session.isSwitching;
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
                this.$store.dispatch('successMessage', 'videochat.alerts.successChatEnded');

                close();
            }
        });

        this.intervalTimer = window.setInterval(async () => {
            await fetch(`${config.BaseUrl}/session/client_seen`, { credentials: 'include' });
        }, 5000);
    }

    close(){
        this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });
    }

    async gotoVoyeur(next:(yes?:boolean | RawLocation)=>void){

        try {
            await this.$store.dispatch('end', 'PLAYER_END');

            await this.$store.dispatch('voyeur/startVoyeur', { performerId: this.$store.state.session.activePerformer.id, ivrCode: this.$store.state.session.activeIvrCode });

            next({
                name: 'Voyeur',
                params: {
                    id: this.$store.state.session.activePerformer.advert_numbers[0].advertNumber.toString()
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
    }

    broadcastError(message: string){
        this.stateMessages.push(message);
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
                var devices = new Devices();
                devices.getCameras().then( cams=>{
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

        if (autoLeaves.indexOf(this.activeState) > -1 || this.isSwitching || to.name === 'Voyeur'){
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
            this.navigation.next(true);
        }
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
            this.$store.dispatch('end', 'PLAYER_END');
        }
    }
}
