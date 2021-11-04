import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import config, { host } from '../../config';

import './cameras.scss';
import WithRender from './cameras.tpl.html';


@WithRender
@Component
export default class Cameras extends Vue {

    cams: any = config.Cameras;
    host: string = host;

    get image(){
        return (idx: any) => {
            return `${host}/camsnapshot.jpg?idx=${idx}&count=686?t=1636058055796`;
        };
    }
}