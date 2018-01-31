import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import config from '../../../../config';

import Stream from './stream';

const swfobject = require('swfobject');

@Component({
    template: '<div><div id="viewSWF"></div></div>',
})
export class Rtmp extends Stream {

    state:string = '';

    public onStateChange(value:string){
        if (this.state == value)
            return;

        this.state = value;
        this.$emit('stateChange', value); 
    }

    mounted(){
        window.flashCallbacks = {
            onStateChange: this.onStateChange.bind(this),
            onError: this.onError.bind(this)
        };

        const attrs = {
            name: 'swf'
        };

        const params = {
            wmode: 'transparent',
            allowFullScreen: true
        };

        let wowza = this.wowza;
        if (this.playToken){
            wowza = wowza.replace(/token=(.+)/i, `token=${this.playToken}`)
        }

        const flashvars = {
            wowza,
            playStream: this.playStream,
            listener: 'flashCallbacks'
        };

        const file = this.muted ? 'Peek' : 'Chat';

        swfobject.embedSWF('/static/View.swf', 'viewSWF', '100%', '100%', '10.2.0', true, flashvars, params, attrs);
    }

    beforeDestroy(){
        delete window.flashCallbacks;
    }
}