import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import config from '../../../../config';
import Stream from './stream';

import {Player, WRTCUtils as utils } from 'typertc';

import {  isWebrtcMuted } from '../../../../util';

const Platform = require('platform');

@Component({
    template: '<div><video class="webrtc" playsinline webkit-playsinline autoplay :style="{ backgroundImage: \'url(\' + loadScreen + \')\' }"></video><span class="videochat__mute hidden-sm hidden-xs" v-on:click="toggleMute"><i v-bind:class="[\'fa\', mutedClass]"></i></span><span class="videochat__mute-right hidden-md hidden-lg" v-on:click="toggleMute"><i v-bind:class="[\'fa\', mutedClass]"></i></span></div>',
})
export class WebRTC extends Stream {

    player:Player;
    loadScreen:string = "https://push.thuis.nl/snapshots/" + this.$store.state.session.activePerformer.id +"/snapshot_clear.jpg?" + Math.random();
    mutedClass: string = "";

    toggleMute(){
        const video = <HTMLVideoElement>this.$el.querySelector('.webrtc');

        if(video.muted){
            video.muted = false;
            this.mutedClass  = "fa-volume-up";
        } else {
            video.muted = true;
            this.mutedClass  = "fa-volume-off";
        }
    }

    mounted(){

        const platform = Platform.parse(navigator.userAgent);
        //if there is sound check if its no safari
        const muted:boolean = !this.muted ? isWebrtcMuted(platform) : this.muted;

        this.mutedClass =  muted ? "fa-volume-off" :  "fa-volume-up";

        const video = <HTMLVideoElement>this.$el.querySelector('.webrtc');
        video.autoplay = true;

        const wowzaParts = utils.parseUrl(this.wowza);
        utils.validate(wowzaParts);

        const webrtcWowzaHost = wowzaParts.host + '/webrtc-session.json';

        const options = {
            wowza : webrtcWowzaHost,
            applicationName : wowzaParts.application,
            token : this.playToken ? this.playToken : wowzaParts.parameters.token,
            streamName : this.playStream,
            element : video,
            useWebSockets : true,
            debug : true, //for now on acceptance
            muted : muted // muted //mac os bug  (freeze frame if autoplay)
        };

        this.player = new Player(options);
        this.player.onStateChange = this.onStateChange.bind(this);
        this.player.onError = this.onError.bind(this);



        //this.player.play();
    }

    public onStateChange(value: string){
        if(value == "active"){
            this.loadScreen = '';
        }

        this.$emit('stateChange', value);

    }

    public onError(message: string){
        this.loadScreen = '';
        console.log("message", message);
        this.$emit('error', message);
    }

    beforeDestroy(){
        if(this.player){
            this.player.stop();
        }
    }
}
