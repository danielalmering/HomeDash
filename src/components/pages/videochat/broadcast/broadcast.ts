import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';
//import 'swfobject';
const swfobject = require('swfobject');
import WithRender from './broadcast.tpl.html';

enum Quality{ LOW, MEDIUM, HIGH }

export interface Caster{
    getCameras(): [{name: string, selected: boolean}];
    setCamera( name: string ): void;
    getMicrophones(): [{name: string, selected: boolean}];
    setMicrophone( name: string): void;
    toggleMicrophone( on: boolean ): void;
    getQuality(): Quality;
    setQuality( value: Quality ): void;
}

@WithRender
@Component
export default class Broadcast extends Vue{

    constructor(){
        super();
        this.onStateChange = this.onStateChange.bind(this);
        this.onError = this.onError.bind(this);
    }

    @Prop() streamType: string = 'RTMP';

    @Prop() wowza: string;

    @Prop() publishStream: string;

    @Prop() cam: boolean | string = true;

    @Prop() mic: boolean | string = false;

    @Prop() quality: Quality = Quality.MEDIUM;

    @Watch('mic') onMicChanged(value: boolean | string, oldValue: boolean | string) {
        if (typeof value === 'boolean'){
            //a boolean turns the mic on or off..
            this.flash.toggleMicrophone(value);
        } else if (!value){
            //an empty string turns the mic off...
            this.flash.toggleMicrophone(false);
        } else {
            //a string sets the mic to that specific mic.
            this.flash.setMicrophone(value);
        }
    }

    @Watch('cam') onCamChanged(value: string, oldValue: string) {
        if (typeof value !== 'string'){
            return;
        }
        this.flash.setCamera(value);
    }

    @Watch('quality') onQualityChanged(value: Quality, oldValue: Quality){
        this.flash.setQuality(value);
    }

    get flash(): Caster{
        return this.$el.querySelector('#broadcastSWF') as any;
    }

    mounted(){
        const attrs = {'name': 'swf', 'id': 'broadcastSWF'};
        const params = {
            wmode : 'transparent',
            allowFullScreen : false
        };

        this.listener = `broadcast${new Date().getTime()}`;

        const bla: any = window;
        bla[this.listener] = {
            onStateChange: this.onStateChange,
            onError: this.onError
        };

        const flashvars = {
            wowza: this.wowza,
            publishStream: this.publishStream,
            listener: this.listener
        };

        swfobject.embedSWF('/static/Publish.swf', 'broadcastSWF', '100%', '100%', '10.2.0', true, flashvars, params, attrs);
    }

    destroyed(){
        const bla: any = window;
        delete bla[this.listener];
    }

    private listener: string;

    public onStateChange(value: string){
        this.$emit('stateChange', value);
    }

    public onError(message: string){
        this.$emit('error', message);
    }

}
