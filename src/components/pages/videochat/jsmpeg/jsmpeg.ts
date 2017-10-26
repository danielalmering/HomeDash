import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import { State } from '../../../../models/session';
import { SessionData } from '../../../../store/Session';

import jsmpeg from 'jsmpeg';

import './jsmpeg.scss';

@Component({
    template: '<canvas class="jsmpeg"></canvas>',
})
export default class JSMpeg extends Vue {

    mounted(){
        //wss://push02.thuis.nl/jsmpeg?stream=6344c87d04fb045b82650aa4cac8c9ca&token=1635bf8608d508943b2be8666f97cdf6&hash=5B9F45B17A77831EA6C5346464BD2

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