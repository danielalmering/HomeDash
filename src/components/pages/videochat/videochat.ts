import Vue from 'vue';
import jsmpeg from 'jsmpeg';

import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { State, SessionType } from '../../../models/Sessions';
import { SessionData, RequestPayload } from '../../../store/Session';

import notificationSocket from '../../../socket';
import Chat from './chat/chat';
import Broadcast, { Caster } from './broadcast/broadcast';
import Jsmpeg from './streams/jsmpeg';
import Rtmp from './streams/rtmp';
import WebRTC from './streams/webrtc';
import config from '../../../config';
import Confirmations from '../../layout/Confirmations.vue';

import './videochat.scss';
import Performer from '../performer';

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

@Component({
    template: require('./videochat.tpl.html'),
    components: {
        chat: Chat,
        broadcast: Broadcast,
        jsmpeg: Jsmpeg,
        rtmp: Rtmp,
        webrtc: WebRTC,
        confirmation: Confirmations
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

    cameras: {name: string, selected: boolean}[];
    microphones: {name: string, selected: boolean}[];

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

        return this.$store.state.session.activeSessionData.streamTransportType;
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

    get type(){
        return 'jsmpeg';
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
                this.$store.dispatch('openMessage', {
                    content: 'video.alerts.successChatEnded',
                    class: 'success'
                });

                this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });
            }
        });

        this.intervalTimer = setInterval(async () => {
            await fetch(`${config.BaseUrl}/session/client_seen`, { credentials: 'include' });
        }, 1000);
    }

    close(){
        this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });
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
            const flash: Caster = this.$el.querySelector('#broadcastSWF') as any;
            this.microphones = flash.getMicrophones();
            const selected = this.microphones.find(mic => mic.selected);
            if (selected){
                this.broadcasting.mic = selected.name;
            }
        }
    }

    setCamera(event: Event){
        const camName = (<HTMLSelectElement>event.srcElement).value;
        this.cameras.forEach(cam => cam.selected = (cam.name === camName));
        this.broadcasting.cam = camName;
    }

    setMicrophone(event: Event){
        const micName = (<HTMLSelectElement>event.srcElement).value;
        this.microphones.forEach(mic => mic.selected = (mic.name === micName));
        this.broadcasting.mic = micName;
    }

    broadcastStateChange(state: string){
        this.stateMessages.push(state);
    }

    broadcastError(message: string){
        this.stateMessages.push(message);
    }

    viewerStateChange(state: string){
        console.log(`yoyo dit is de state: ${state}`);
        if (state === 'active'){
            this.$store.dispatch('setActive');
        }
    }

    viewerError(message: string){
        console.log(message);
    }

    toggleSettings(){
        this.broadcasting.settings = !this.broadcasting.settings;
        //go get the list of devices if the "settings" will toggle to visible
        if (this.broadcasting.settings){
            const flash: Caster = this.$el.querySelector('#broadcastSWF') as any;

            this.cameras = flash.getCameras();
            let selected = this.cameras.find(cam => cam.selected);
            if (selected && this.broadcasting.cam !== selected.name){
                this.broadcasting.cam = selected.name;
            }

            this.microphones = flash.getMicrophones();
            selected = this.microphones.find(mic => mic.selected);
            if (selected && this.broadcasting.mic && this.broadcasting.mic !== selected.name){
                this.broadcasting.mic = selected.name;
            }
        }
    }

    get activeState(): State {
        return this.$store.state.session.activeState;
    }

    public beforeRouteUpdate(to:Route, from:Route, next:(yes?:boolean)=>void){
        const autoLeaves = [ State.Canceling, State.Ending, State.Idle ];
        if (autoLeaves.indexOf(this.activeState) > -1){
            return next();
        }

        this.navigation = {to, from, next};
        this.leave = this.leaveToPeek;
        this.askToLeave = true; 
    }

    public beforeRouteLeave(to:Route, from:Route, next:(yes?:boolean)=>void){
        const autoLeaves = [ State.Canceling, State.Ending, State.Idle ];
        if (autoLeaves.indexOf(this.activeState) > -1){
            return next();
        }

        this.navigation = {to, from, next};
        this.leave = this.leaveToProfile;
        this.askToLeave = true;
    }

    askToLeave:boolean = false;

    navigation: {
        to:Route, from:Route, next:(yes?:boolean)=>void
    }

    leave(){}

    async leaveToPeek(){
        this.isEnding = true;
        await this.$store.dispatch('end', 'PLAYER_END');
        const id = parseInt(this.navigation.to.params.id);
        const performerResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/performer_number/${id}?limit=10`, {
            credentials: 'include'
        });

        const data = await performerResults.json();

        this.askToLeave = false;
        //dispatching the request for the next peek action
        //yields the next page change

        const toSend:RequestPayload = {
            type:'startRequest',
            performer: this.performer,
            sessionType: SessionType.Peek,
            ivrCode: this.$store.state.session.activeIvrCode,
            displayName: this.$store.state.session.activeDisplayName
        }
        this.$store.dispatch<RequestPayload>( toSend ); 
    }

    @Watch('activeState') async onSessionStateChange(value:State, oldValue:State){
        if (value == State.Accepted){
            await this.$store.dispatch('initiate');
            this.navigation.next(true);
        }
    }

    leaveToProfile(){
        this.askToLeave = false;
        this.navigation.next(true);
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
        this.$store.dispatch('end', 'PLAYER_END');
    }
}