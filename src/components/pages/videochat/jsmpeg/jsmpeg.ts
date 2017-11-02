import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import { State } from '../../../../models/Sessions';
import { SessionData } from '../../../../store/Session';

import jsmpeg from 'jsmpeg';

import './jsmpeg.scss';

@Component({
    template: '<canvas class="jsmpeg"></canvas>',
})
export default class JSMpeg extends Vue {

    mounted(){
        const videoUrl = '';

        let video = <HTMLCanvasElement>this.$el.getElementsByClassName('jsmpeg')[0];

        const player = new jsmpeg.Player('', {
            canvas: video,
            protocols: 'videoJSMPEG',
            audio: true,
            streaming: true,
            pauseWhenHidden: false,
            disableGl: false
        });
    }
}