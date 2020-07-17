import Vue from 'vue';
import { Component, Watch, Prop } from 'vue-property-decorator';
import { State } from '../../../../models/Sessions';
import config from '../../../../config';

import Stream from './stream';
import { thistle } from 'color-name';
import { throws } from 'assert';
import { errorMonitor } from 'events';

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
        'end',
        'destroyed'
    ];

    private _state = NanoCosmos.states[0];

    get state(): string{
        return this._state;
    }

    set state(value: string){
        
        //destroying and erro is always alowed
        //otherwise, the order of states should be obeyed
        /*if (value != 'destroying'){
            const current = NanoCosmos.states.indexOf(this._state);
            const next = NanoCosmos.states.indexOf(value);
            if (next - current != 1){
                throw new Error(`invalid state change from ${this._state} to ${value}`);
            }
        }*/
  
        console.log(`${this.tile} changing state from ${this._state} to ${value}`);
        this._state = value;
        
        
        //this.onStateChange( value );
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

    /*@Prop({required: true, type: String})
    public streamname: string;

    @Prop({required: true, type: String})
    public url: string;

    @Prop({required: true, type: String})
    public token: string;*/

    @Prop({default: false, type: Boolean})
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
            
            if(this.isMain) {
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
             //this.state = 'error';
             console.warn('switching error!', e);
        }
    }

    @Watch('wowza')
    onWowzaSwitch() {

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
        //`ws://${config.H5Server}:8181/h5live/stream`;
        return `wss://${config.H5Server}:443/h5live/stream`;
    }

    private getH5hls(): string {
        //`http://${config.H5Server}:8180/h5live/http/playlist.m3u8`;
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
            "options": {
                "adaption": {
                    "rule": "deviationOfMean"
                },
                "switch": {
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
            //console.log('update source ok');
        }).catch((ex : any) => {
            console.log('nano error', ex.message);
        });
    }

    private load(){
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
            },
            'events': {
                onReady: (s: any) => { this.log(s); },
                onPlay: (s: any) => { this.onPlay(s); },
                onPause: (s: any) => { this.onPause(s); },
                onLoading: (s: any) => { this.onLoading(s); },
                onStartBuffering: (s: any) => { this.log(s); },
                onStopBuffering: (s: any) => { this.onStopBuffering(s); },
                onError: (s: any) => { this.onNanoCosmosError(s); },
                //onStats: (s: any) => { this.log(s); },
                //onMetaData: (s: any) => { this.onMetaData(s); },
                onMuted: (s: any) => { this.log(s); },
                onUnmuted: (s: any) => { this.log(s); },
                onVolumeChange: (s: any) => { this.log(s); },
                onStreamInfo: (s: any) => { this.log(s); },
                onWarning: (s: any) => { this.log(s); },
                onUpdateSourceInit: (s: any) => { this.updateSourceInit(s); },
                onUpdateSourceSuccess: (s: any) => {this.updateSourceSuccess(s); },
                onUpdateSourceFail: (event: any) => { this.updateSourceFail(event); },
                onUpdateSourceAbort: (event: any) => { this.updateSourceAbort(event); },
                onDestroy: (s: any) => { this.onDestroy(s) }
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
            console.log('nano error', ex.message);
            this.state = 'failed';
        });

    }

    private updateSourceSuccess(event: any) {
       // this.state = 'playing';
    };


    private updateSourceFail(event: any) {
        this.isFailed = true;
        this.state = 'failed';
    }


    private updateSourceAbort(event: any) {
        //this.state = 'update_abort';
    }

    private updateSourceInit(event : any) {
        this.state = 'loading';
    };

    private onDestroy(event: any) {
        //console.log('destroyed, ', event);
        this.state = 'destroy';

        if(this.playStreamSwitch || this.isFailed){
            console.debug(`switching playStreamSwitch: ${this.playStreamSwitch} or failed: ${this.isFailed} ${event}`);
            
            this.load();

            this.playStreamSwitch = false;
            this.isFailed = false;
        } else {
            //this.state = 'destroyed';
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
        this.log(s);
        if(this.$store.state.session.activeState !== State.Active){
            this.onStateChange('active');

        }
    }

    private onStopBuffering(s: any){
        this.log(s);
    }

    private onNanoCosmosError(s: any){
        this.state = 'failed';
      
       
        this.isFailed = true;
        //this.end();
        if(s.data && s.data.code === 2002){

           this.onStateChange('disconnected');
        } else {
           this.log(s);
        }

        this.onError(s);

    }

    private log(val: any){
        if(this.debug){
            console.log(val);
        }
    }

    private end(){

        this.state = 'ending';
        if(!this.player){
            console.log('no player')
            return false;
        }
          
        console.log('destroying..');
        this.player.destroy();
        //this.player = null;
        //delete this.player;

        return true;
    }
}
