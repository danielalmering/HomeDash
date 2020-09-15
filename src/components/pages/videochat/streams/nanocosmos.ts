import Vue from 'vue';
import { Component, Watch, Prop } from 'vue-property-decorator';
import { State } from '../../../../models/Sessions';
import config from '../../../../config';

import Stream from './stream';
import { thistle } from 'color-name';
import { throws } from 'assert';
import { errorMonitor } from 'events';
import { isDev, log, warn } from '../../../../utils/main.util';

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
    template: '<div class="nanocosmos" :id="id"></div>',
})
export default class NanoCosmos extends Stream {

    static states = [
        'initializing',
        'switching',
        'updating',
        'failed',
        'loading',
        'playing',
        'pause',
        'ending',
        'destroy'
    ];

    private _state = NanoCosmos.states[0];

    get state(): string{
        return this._state;
    }

    set state(value: string){
        log(`${this.tile} changing state from ${this._state} to ${value}`);
        this._state = value;
    }

    constructor(){
        super();
        this.id = Math.round( Math.random() * Date.now() ).toString(16);
        this.state = NanoCosmos.states[0];
    }

    private id: string;

    @Prop({ default: true, type: Boolean})
    public isMain: Boolean;

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

    @Prop({ default: false, type: Boolean})
    public keepFrame: Boolean;

    @Prop({ default: true, type: Boolean })
    public displayAudioOnly: Boolean;

    @Prop({ default: false, type: Boolean})
    public audioPlayer: Boolean;

    @Prop({default: isDev, type: Boolean})
    public debug: Boolean;

    @Prop({default: -1, type: Number})
    public tile: Number;

    //TODO typescript declaration of NanoPlayer
    private player: any;

    private playStreamSwitch: boolean = false;
    private isFailed: boolean = false;

    @Watch('playStream')
    onPlaystreamSwitch(){
        //TODO: Hotze very complex should be states not booleans (but works for now!)
        try {

            if(this.isMain){
                this.state = 'switching';
                this.playStreamSwitch = true;
                this.end();
            } else {
                if(!this.isFailed) {
                    this.updateSource();
                } else {
                    this.end();
                }
            }
        } catch(e) {
             this.state = 'failed';
             warn('switching error!', e);
        }
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
        this.playStreamSwitch = false;
        this.end();
    }

    private getH5WebSocket(): string {
        return `wss://${config.H5Server}:443/h5live/stream`;
    }

    private getH5hls(): string {
        return `https://${config.H5Server}:443/h5live/http/playlist.m3u8`;
    }

    private updateSource() {

        this.state = 'updating';
        let wowza = this.wowza;
        if (this.playToken){
            wowza = wowza.replace(/token=(.+)/i, `token=${this.playToken}`);
        }

        const source = {
            'entries': [
                    {
                        'index': 0,
                        'h5live': {
                             // your rtmp stream
                            'rtmp': {
                                'url': wowza,
                                'streamname': this.playStream
                            },
                            'server': {
                                'websocket': this.getH5WebSocket(),
                                'hls': this.getH5hls()
                            },
                        }
                    }
            ],
            'startIndex': 0,
            'options': {
                'adaption': {
                    'rule': 'deviationOfMean'
                },
                'switch': {
                    'method': 'server',
                    'pauseOnError': false,
                    'forcePlay': true,
                    'fastStart': true,
                    'timeout': 20
                }
            },
        };

        this.player.updateSource(source).then((s: any) => {
            //na da?
            log('update source ok');
        }).catch((ex : any) => {
           warn('nano error', ex.message);
        });
    }

    private load(){
        log('loading..');
        this.state = 'loading';
        this.player = new NanoPlayer(this.id);

        let wowza = this.wowza;
        if (this.playToken){
            wowza = wowza.replace(/token=(.+)/i, `token=${this.playToken}`);
        }

        const configH5LIVE = {
            'source': {
                'entries': [
                    {
                        'index': 0,
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
                    }
                ],
                'startIndex': 0,
                'options': {
                    'adaption': {
                        'rule': 'deviationOfMean'
                    },
                    'switch': {
                        'method': 'server',
                        'pauseOnError': false,
                        'forcePlay': true,
                        'fastStart': true,
                        'timeout': 20
                    }
                },
            },
            'events': {
                onReady: (s: any) => { log(s); },
                onPlay: (s: any) => { this.onPlay(s); },
                onPause: (s: any) => { this.onPause(s); },
                onLoading: (s: any) => { this.onLoading(s); },
                onStartBuffering: (s: any) => { log(s); },
                onStopBuffering: (s: any) => { this.onStopBuffering(s); },
                onError: (s: any) => { this.onNanoCosmosError(s); },
                onVolumeChange: (s: any) => { log(s); },
                onStreamInfo: (s: any) => { log(s); },
                onWarning: (s: any) => { log(s); },
                onUpdateSourceInit: (s: any) => { this.updateSourceInit(s); },
                onUpdateSourceSuccess: (s: any) => {this.updateSourceSuccess(s); },
                onUpdateSourceFail: (event: any) => { this.updateSourceFail(event); },
                onUpdateSourceAbort: (event: any) => { this.updateSourceAbort(event); },
                onDestroy: (s: any) => { this.onDestroy(s); }
            },
            'playback': {
                'autoplay': this.autoplay,
                'muted':  this.muted,
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
                },
                'timeouts': {
                   loading: 10,
                   buffering: 10,
                   connecting: 5
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
            },
            'style': this.getStyle()
        };

        this.player.setup(configH5LIVE).then((s: any) => {
            //na da?
            this.isFailed = false;

        }).catch((ex : any) => {
            warn('nano error', ex.message);
            this.state = 'failed';
        });

    }

    private updateSourceSuccess(event: any) {
       // this.state = 'playing';
    }


    private updateSourceFail(event: any) {
        this.isFailed = true;
        this.state = 'failed';
    }


    private updateSourceAbort(event: any) {
        //this.state = 'update_abort';
    }

    private updateSourceInit(event : any) {
        this.state = 'loading';
    }

    private onDestroy(event: any) {
        log('destroyed, ', event);
        this.state = 'destroy';

        if(this.playStreamSwitch || this.isFailed){
            this.load();

            this.playStreamSwitch = false;
            this.isFailed = false;
        }
    }

    private onPause(s: any){
         this.state = 'pause';
    }

    private onLoading(s: any) {
         this.state = 'loading';
    }

    private onPlay(s: any) {
        this.state = 'playing';
        log(s);

        if(this.$store.state.session.activeState !== State.Active){
            this.onStateChange('active');
        }
    }

    private onStopBuffering(s: any){
        log(s);
    }

    private onNanoCosmosError(s: any){
        this.state = 'failed';

        this.isFailed = true;
        //this.end();
        if(s.data && s.data.code === 2002){
           this.onStateChange('disconnected');
        } else {
           log(s);
        }

        this.onError(s);
    }

    private end(){

        this.state = 'ending';
        if(!this.player){
            log('player not found');
            //Bug fix for switching peek
            if(this.playStreamSwitch){
                log('player reload from end');
                this.load();

                this.playStreamSwitch = false;
            }
            return false;
        }

        log('destroying..');
        this.player.destroy();

        return true;
    }
}
