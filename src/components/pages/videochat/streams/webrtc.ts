import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import config from '../../../../config';
import Stream from './stream';

import {Player, WRTCUtils as utils } from 'typertc';

@Component({
    template: '<div><video class="webrtc"></video></div>',
})
export default class WebRTC extends Stream {

    private player: Player;

    mounted(){
        const video = <HTMLVideoElement>this.$el.querySelector('.webrtc');
        video.autoplay = true;
        
        const wowzaParts = utils.parseUrl(this.wowza);
        utils.validate(wowzaParts);
        
        const options = {
            wowza: wowzaParts.host + "/webrtc-session.json",
            applicationName: wowzaParts.application,
            token: wowzaParts.parameters.token,
            streamName: this.playStream,
            element: video,
            useWebSockets: true,
            debug: true,
            muted: false
        };
        
        this.player = new Player(options);
        this.player.onStateChange = this.onStateChange.bind(this);
        this.player.onError = this.onError.bind(this);
    }

    beforeDestroy(){
        if(this.player){
            this.player.stop();
        }
    }
}
