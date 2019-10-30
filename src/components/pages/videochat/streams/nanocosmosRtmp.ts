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
    displayMutedAutoplay: boolean;
}

@Component({
    template: '<div class="nanocosmos"  :id="id"></div>',
})
export default class NanoCosmosRtmp extends Stream {

    constructor(){
        super();
        this.id = Math.round( Math.random() * Date.now() ).toString(16);
    }

    private id: string;

    @Prop({ default: true, type: Boolean})
    public autoplay: Boolean;

    //style properties
    @Prop({ default: 'auto', type: String})
    public width: string;

    @Prop({ default: 'auto', type: String})
    public height: string;

    @Prop({ default: '4/3', type: String})
    public aspectratio: string;

    @Prop({ default: false, type: Boolean })
    public controls: Boolean;

    @Prop({ default: true, type: Boolean })
    public interactive: Boolean;

    @Prop({ default: true, type: Boolean })
    public view: Boolean;

    @Prop({ default: 'letterbox', type: String})
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

    @Prop({default: false, type: Boolean})
    public debug: Boolean;

    //TODO typescript declaration of NanoPlayer
    private player: any;

    @Watch('playStream')
    onPlaystreamSwitch(){
        try{
            this.end();
            this.load();
        } catch(e) {
             console.log('switching error!');
        }
    }

    @Watch('wowza')
    onWowzaSwitch(){
        /*console.log("wowza switch");
        this.end();
        sleep(1000).then(() =>{
            this.load();
        });*/
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
            audioPlayer: this.audioPlayer,
            displayMutedAutoplay: false,
        };
    }

    mounted(){
       if(!this.isSwitching){
           this.load();
       }
    }

    beforeDestroy(){
        this.end();
    }

    private getH5WebSocket(): string {
        //`ws://${config.H5Server}:8181/h5live/stream`;
        return `wss://${config.H5Server}:443/h5live/stream`;
    }

    private getH5hls(): string {
        //`http://${config.H5Server}:8180/h5live/http/playlist.m3u8`;
        return `https://${config.H5Server}:443/h5live/http/playlist.m3u8`;
    }

    private load(){

        this.player = new NanoPlayer(this.id);

        let wowza = this.wowza;
        if (this.playToken){
            wowza = wowza.replace(/token=(.+)/i, `token=${this.playToken}`);
        }

        const configH5LIVE = {
            'source': {
                'h5live': {
                    'server': {
                        'websocket': this.getH5WebSocket(),
                        'hls': this.getH5hls()
                    },
                    'rtmp': {
                        'url': wowza,
                        'streamname': this.playStream
                    }
                }
            },
            'events': {
                onReady: (s: any) => { this.log(s); },
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
                'autoplay': this.autoplay,//this.autoplay,
                'muted':  this.muted,
                'forceTech': 'flash',
                'allowSafariHlsFallback': true,
                'automute': true,
                'metadata': true,
                'flashplayer': '../../../../../static/nano.player.swf',
                'keepConnection': true,
                'reconnect': {
                minDelay: 2,
                maxDelay: 5,
                delaySteps: 1,
                maxRetries: 3
                }
            },
            tweaks: {
                buffer: {
                    min: 0.2,
                    start: 0.5,
                    max: 8.0,
                    target: 1.2,
                    limit: 1.7
                },
                bufferDynamic: {
                    offsetThreshold: 2,
                    offsetStep: 0.5,
                    cooldownTime: 10
                }
            }
            ,'style': this.getStyle()
        };

        this.player.setup(configH5LIVE).then((s: any) => {
            //na da?
        }, function (error: any) {
            console.log('nano error', error.message);
        });

    }

    private onPlay(s: any) {
        this.log(s);
        if(this.$store.state.session.activeState !== State.Active){
            this.onStateChange('active');
        }
    }

    private onStopBuffering(s: any){
        /*this.end();
        this.load();*/
        this.log(s);
    }

    private onNanoCosmosError(s: any){
        if(s.data && s.data.code === 2002){
           this.onStateChange('disconnected');
        } else {
           this.log(s);
           this.onError(s);
        }
    }

    private log(val: any){
        if(this.debug){
            console.log(val);
        }
    }

    private end(){
        if(!this.player)
          return false;

        this.player.destroy();

        return true;
    }
}