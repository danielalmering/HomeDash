import Vue from 'vue';
import { Component, Watch, Prop } from 'vue-property-decorator';
import { State } from '../../../../models/Sessions';
import config from '../../../../config';

import Stream from './stream';

declare const NanoPlayer: any;

export class H5Style {
    height: string;
    width: string;
    aspectratio: string;
    controls: boolean;
    interactive: boolean;
    view: boolean;
    scaling: string;
    keepFrame: boolean;
    displayAudioOnly: boolean;
    audioPlayer: boolean;
}

@Component({
    template: '<div id="playerDiv"></div>',
})
export default class NanoCosmos extends Stream {


    @Prop({ default: true, type: Boolean})
    public autoplay: Boolean;

    //style properties
    @Prop({ default: '100%', type: String})
    public width: string;

    @Prop({ default: '100%', type: String})
    public height: string;

    @Prop({ default: '16/9', type: String})
    public aspectratio: string;

    @Prop({ default: false, type: Boolean })
    public controls: Boolean;

    @Prop({ default: true, type: Boolean })
    public interactive: Boolean;

    @Prop({ default: true, type: Boolean })
    public view: Boolean;

    @Prop({ default: 'fill', type: String})
    public scaling: String;

    @Prop({ default: true, type: Boolean})
    public keepFrame: Boolean;

    @Prop({ default: true, type: Boolean })
    public displayAudioOnly: Boolean;

    @Prop({ default: false, type: Boolean})
    public audioPlayer: Boolean;

    /*@Prop({required: true, type: String})
    public streamname: string;

    @Prop({required: true, type: String})
    public url: string;

    @Prop({required: true, type: String})
    public token: string;*/

    @Prop({default: true, type: Boolean})
    public debug: Boolean;

    //TODO typescript declaration of NanoPlayer
    private player: any;

    @Watch('playStream')
    onPlaystreamSwitch(){
        this.end();
        this.load();
    }

    private getStyle(): H5Style {
        return <H5Style>{
          height: this.width,
          width: this.height,
          aspectratio: this.aspectratio,
          controls: this.controls,
          interactive: this.interactive,
          view: this.view,
          scaling: this.scaling,
          keepFrame: this.keepFrame,
          displayAudioOnly: this.displayAudioOnly,
          audioPlayer: this.audioPlayer
        };
    }

    mounted(){
       this.load();
    }

    beforeDestroy(){
        this.end();
    }

    private getH5WebSocket(): string {
        return `ws://${config.H5Server}:8181/h5live/stream`;
    }

    private getH5hls(): string {
        return `http://${config.H5Server}:8180/h5live/http/playlist.m3u8`;
    }

    private load(){
        this.player = new NanoPlayer('playerDiv');

        const configH5LIVE = {
            'source': {
                'h5live': {
                    'server': {
                        'websocket': this.getH5WebSocket(),
                        'hls': this.getH5hls()
                    },
                    'rtmp': {
                        'url': this.wowza,
                        'streamname': this.playStream
                    }
                }
            },
            'events': {
                onReady: (s: any) => { this.onReady(s); },
                onPlay: (s: any) => { this.onPlay(s); },
                onPause: (s: any) => { this.log(s); },
                onLoading: (s: any) => { this.log(s); },
                onStartBuffering: (s: any) => { this.log(s); },
                onStopBuffering: (s: any) => { this.onStopBuffering(s); },
                onError: (s: any) => { this.onNanoCosmosError(s); },
                //onStats: (s: any) => { this.log(s); },
                //onMetaData: (s: any) => { this.onMetaData(s); },
                onMuted: (s: any) => { this.log(s); },
                onUnmuted: (s: any) => { this.log(s); },
                onVolumeChange: (s: any) => { this.log(s); },
                onStreamInfo: (s: any) => { this.log(s); },
                onWarning: (s: any) => { this.log(s); }
            },
            'playback': {
                'autoplay': this.autoplay,
                'muted': this.muted,
                'flashplayer': config.H5FlashSwf,
                'reconnect': {
                   minDelay: 2,
                   maxDelay: 5,
                   delaySteps: 1,
                   maxRetries: 3
                }
            },
            'style': this.getStyle()
        };

        this.player.setup(configH5LIVE).then((s: any) => {
            if(this.debug){
              console.log('setup success');
              console.log(`config:  ${JSON.stringify(s, undefined, 4)}`);
            }
        }, function (error: any) {
            console.log(error.message);
        });
    }

    private onReady(s: any) {
        console.log('ready', s)
    }

    private onPlay(s: any) {
        console.log(s);
        if(this.$store.state.session.activeState !== State.Active){
            this.onStateChange('active');
        }
    }

    private onStopBuffering(s: any){
        this.end();
        this.load();
    }

    private onNanoCosmosError(s: any){
        if(s.data && s.data.code === 2002){
            this.onStateChange('disconnected');
        } else {
           console.log(s);
           this.onError(s);
        }
    }

    private log(val: any){
        console.log(val);
    }

    private end(){
        if(!this.player)
          return false;

        //this.player.pause();
        this.player.destroy();

        return true;
    }
}
