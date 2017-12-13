import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import config from '../../../../config';
import Stream from './stream';

import * as typeRTC from 'typertc';

@Component({
    template: '<div><video class="webrtc"></video></div>',
})
export default class WebRTC extends Stream {

    private player: typeRTC.Player;

    mounted(){
        const video = <HTMLVideoElement>document.querySelector('.webrtc');
        video.autoplay = true;
        
        const wowzaParts = typeRTC.WRTCUtils.parseUrl(this.wowza);
        typeRTC.WRTCUtils.validate(wowzaParts);

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

        this.player = new typeRTC.Player(options);
        this.player.onStateChange = this.onStateChange;
        this.player.onError = this.onError;
    }

    beforeDestroy(){
        if(this.player){
            this.player.stop();
        }
    }
}
