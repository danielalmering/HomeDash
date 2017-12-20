import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';
import { Publisher, WRTCUtils } from 'typertc';
import Stream from '../streams/stream';

export enum Quality{ LOW, MEDIUM, HIGH }

export default class Broadcast extends Stream{

    @Prop() wowza: string;

    @Prop() publishStream: string;

    @Prop() cam: boolean | string = true;

    @Prop() mic: boolean | string = false;

    @Prop() quality: Quality = Quality.MEDIUM;

    public onStateChange(value: string){
        this.$emit('stateChange', value);
    }

    public onError(message: string){
        this.$emit('error', message);
    }

}
