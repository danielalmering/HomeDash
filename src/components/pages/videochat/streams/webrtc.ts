import Vue from 'vue';
import {Component, Watch} from 'vue-property-decorator';

import config from '../../../../config';
import Stream from './stream';

import {Player, WRTCUtils as utils } from 'typertc';

import {isWebrtcMuted, sleep} from '../../../../util';

const Platform = require('platform');

@Component({
    template: '<div><video class="webrtc" playsinline webkit-playsinline autoplay></video><span v-if="!isPeek" class="videochat__mute hidden-sm hidden-xs" v-on:click="toggleMute"><i v-bind:class="[\'fa\', mutedClass]"></i></span><span v-if="!isPeek" class="videochat__mute-right hidden-md hidden-lg" v-on:click="toggleMute"><i v-bind:class="[\'fa\', mutedClass]"></i></span></div>',
})
export class WebRTC extends Stream {

    player:Player|null;
    mutedClass: string = "";
    isPeek:boolean = false;


    @Watch('playStream')
    onPlaystreamSwitch(){

        console.log("playstream switch");
        this.end();
        sleep(500).then(() =>{
            this.load();
        });

    }

    @Watch('wowza')
    onWowzaSwitch(){
        /*console.log("wowza switch");
        this.end();
        sleep(1000).then(() =>{
            this.load();
        });*/
    }

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

        this.load();

        //this.player.play();
    }

    private load(){
        const platform = Platform.parse(navigator.userAgent);

        this.isPeek = this.muted;
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
            debug : false,
            muted : muted // muted //mac os bug  (freeze frame if autoplay)
        };

        this.player = new Player(options);
        this.player.onStateChange = this.onStateChange.bind(this);
        this.player.onError = this.onError.bind(this);
    }

    private end(){
        if(this.player){
            this.player.stop();
            this.player = null;
        }
    }

    beforeDestroy(){
        this.end();
    }
}
