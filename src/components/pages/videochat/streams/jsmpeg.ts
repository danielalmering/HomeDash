import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';

import jsmpeg from 'jsmpeg';
import config from '../../../../config';

import Stream from './stream';

@Component({
    template: '<div><canvas width="640" height="480" class="jsmpeg"></canvas></div>',
})
export default class JSMpeg extends Stream {

    constructor(){
        super();
        this.onResize = this.onResize.bind(this);
    }

    player: jsmpeg.Player;

    @Watch('playStream')
    onPlaystreamSwitch(){
        this.end();
        this.load();
    }

    @Watch('wowza')
    onWowzaSwitch(){
        this.end();
        this.load();
    }

    mounted(){
        this.load();        
        this.onResize();
        window.addEventListener("resize", this.onResize);
    }

    destroyed(){
        window.removeEventListener("resize", this.onResize);
    }

    beforeDestroy(){
        this.end();
    }

    private load(){
        const token = this.playToken ? this.playToken : this.wowza.split('?token=')[1];

        const videoUrl = `${config.JsmpegUrl}?stream=${this.playStream}&token=${token}&hash=5B9F45B17A77831EA6C5346464BD2`;
        const video = <HTMLCanvasElement>this.$el.querySelector('.jsmpeg');

        this.player = new jsmpeg.Player(videoUrl, {
            canvas: video,
            protocols: 'videoJSMPEG',
            audio: !this.muted,
            streaming: true,
            pauseWhenHidden: false,
            disableGl: false,
            playingStateChange: (playing: boolean) => playing ? this.onStateChange('active') : this.onStateChange('disconnected')
        });
    }

    private end(){
        if(this.player){
            if(this.player.source){
                this.player.source.destroy();
            }

            this.player.stop();
        }
    }

    private onResize(){
        const canvas = <HTMLCanvasElement>this.$el.querySelector("canvas");
        const container = this.$el;

        const canvasRatio = canvas.width / canvas.height;
        const containerRatio = container.clientWidth / container.clientHeight;

        //if the canvas is wider than the container, the canvas should fill out the width
        if (canvasRatio > containerRatio){
            canvas.style.width = '100%';
            canvas.style.height = `${(containerRatio / canvasRatio)*100}%`;
        } else {
            canvas.style.height = "100%";
            canvas.style.width = `${(canvasRatio / containerRatio)*100}%`;
        }
    }
}