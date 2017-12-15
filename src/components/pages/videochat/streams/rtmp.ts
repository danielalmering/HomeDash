import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import jsmpeg from 'jsmpeg';
import config from '../../../../config';

import Stream from './stream';

const swfobject = require('swfobject');

@Component({
    template: '<div><div id="viewSWF"></div></div>',
})
export default class Rtmp extends Stream {

    mounted(){
        window.flashCallbacks = {
            onStateChange: this.onStateChange,
            onError: this.onError
        };

        const attrs = {
            name: 'swf'
        };

        const params = {
            wmode: 'transparent',
            allowFullScreen: true
        };

        const flashvars = {
            wowza: this.wowza,
            playStream: this.playStream,
            listener: 'flashCallbacks'
        };

        swfobject.embedSWF('/static/View.swf', 'viewSWF', '100%', '100%', '10.2.0', true, flashvars, params, attrs);
    }

    beforeDestroy(){
        delete window.flashCallbacks;
    }
}