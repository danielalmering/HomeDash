import Vue from 'vue';
import {Component, Watch} from 'vue-property-decorator';

import Stream from './stream';

import {Player, WRTCUtils as utils } from 'typertc';

import {isWebrtcMuted} from '../../../../utils/video.util';
import { isDev, log } from '../../../../utils/main.util';

const Platform = require('platform');

@Component({
    template: '<div><video class="webrtc" :poster="poster" playsinline webkit-playsinline autoplay></video><span v-if="!isPeek" class="videochat__mute hidden-sm hidden-xs" v-on:click="toggleMute"><i v-bind:class="[\'fa\', mutedClass]"></i></span><span v-if="!isPeek" class="videochat__mute-right hidden-md hidden-lg" v-on:click="toggleMute"><i v-bind:class="[\'fa\', mutedClass]"></i></span></div>',
})
export class WebRTC extends Stream {

    player: Player | undefined;
    mutedClass: string = '';
    isPeek: boolean = false;
    poster: string = require('../../../../assets/images/videoloader-large.gif');


    @Watch('playStream')
    onPlaystreamSwitch(){
        this.end();
        this.load();
    }

    @Watch('wowza')
    onWowzaSwitch(){
       log('wowza switch');
    }

    toggleMute(){
        const video = <HTMLVideoElement>this.$el.querySelector('.webrtc');

        if(video.muted){
            video.muted = false;
            this.mutedClass  = 'fa-volume-up';
        } else {
            video.muted = true;
            this.mutedClass  = 'fa-volume-off';
        }
    }

    mounted(){

        if(!this.isSwitching){
            log('Loading on mount');
            this.load();
        } else {  //wait on playstream change
            log('not loading on mount');
        }

    }

    public load(){
        const platform = Platform.parse(navigator.userAgent);

        this.isPeek = this.muted;
        //if there is sound check if its no safari
        const muted: boolean = !this.muted ? isWebrtcMuted(platform) : this.muted;

        this.mutedClass =  muted ? 'fa-volume-off' :  'fa-volume-up';

        const video = <HTMLVideoElement>this.$el.querySelector('.webrtc');
        video.autoplay = true;

        const wowzaParts = utils.parseUrl(this.wowza);
        utils.validate(wowzaParts);

        const webrtcWowzaHost = `${wowzaParts.host}/webrtc-session.json`;

        const options = {
            wowza : webrtcWowzaHost,
            applicationName : wowzaParts.application,
            token : this.playToken ? this.playToken : wowzaParts.parameters.token,
            streamName : this.playStream,
            element : video,
            useWebSockets : true,
            debug : isDev,
            muted : muted // muted //mac os bug  (freeze frame if autoplay)
        };

        this.player = new Player(options);
        this.player.onStateChange = this.onStateChange.bind(this);
        this.player.onError = this.onError.bind(this);
    }

    private end(){
        if(this.player){
            this.player.stop();
            this.player = undefined;
        }
    }

    beforeDestroy(){
        this.end();
    }
}
