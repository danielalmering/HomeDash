import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';
import jsmpeg from 'jsmpeg';
import config from '../../../../config';
//import 'swfobject';
const swfobject = require('swfobject');

@Component({
    template: require('./view.tpl.html')
})
export default class View extends Vue{

    constructor(){
        super();
        //just making sure the calls from flash are scoped correctly
        this.onStateChange = this.onStateChange.bind(this);
        this.onError = this.onError.bind(this);
    }

    @Prop() streamType: string;

    @Prop() wowza: string;

    @Prop() playStream: string;

    mounted(){
        switch(this.streamType){
            case 'RTMP':
                this.showFlash();
                break;
            case 'JSMPEG':
                this.showJsMpeg();
                break;
            case 'WEBRTC':
                this.showWebRtc();
                break;
            default:
                throw new Error(`${this.streamType} aint no format I ever heard of!`);
        }
    }

    destroyed(){
        if (this.listener){
            const bla: any = window;
            delete bla[this.listener];
        }

        if(this.player){
            if(this.player.source){
                this.player.source.destroy();
            }
            this.player.stop();
        }
    }

    showFlash(){
        const attrs = {'name' : 'swf'};
        const params = {
            wmode : 'transparent',
            allowFullScreen : true
        };

        this.listener = `view${new Date().getTime()}`;

        const bla: any = window;
        bla[this.listener] = {
            onStateChange: this.onStateChange,
            onError: this.onError
        };

        const flashvars = {
            wowza: this.wowza,
            playStream: this.playStream,
            listener: this.listener
        };

        swfobject.embedSWF('/static/View.swf', 'viewSWF', '100%', '100%', '10.2.0', true, flashvars, params, attrs);
    }

    showJsMpeg(){
        const videoUrl = `${config.JsmpegUrl}?stream=${this.playStream}&token=${this.wowza.split('?token=')[1]}&hash=5B9F45B17A77831EA6C5346464BD2`;
        const video = <HTMLCanvasElement>this.$el.querySelector('.jsmpeg');

        const player = new jsmpeg.Player(videoUrl, {
            canvas: video,
            protocols: 'videoJSMPEG',
            audio: true,
            streaming: true,
            pauseWhenHidden: false,
            disableGl: false,
            playingStateChange: (playing: boolean) => playing ? this.onStateChange('active') : this.onStateChange('disconnected')
        });
    }

    showWebRtc(){
        //TODO
    }

    private listener: string;

    private player: jsmpeg.Player;

    public onStateChange(value: string){
        this.$emit('stateChange', value);
    }

    public onError(message: string){
        this.$emit('error', message);
    }

}