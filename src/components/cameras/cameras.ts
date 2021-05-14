import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import config from '../../config';
import jsmpeg from 'jsmpeg';

import './cameras.scss';
import WithRender from './cameras.tpl.html';


@WithRender
@Component
export default class Cameras extends Vue {

    cams: any = config.Cameras;

    mounted(){
        this.createVideos();
    }

    createVideos(){
        this.cams.forEach(function(cam: any){
            const canvas = document.getElementById(cam.id) as any;
            new jsmpeg.Player(`wss://${config.Host}/${cam.url}`, {canvas: canvas});

            const container = canvas.parentElement;
            const canvasRatio = canvas.width / canvas.height;
            const containerRatio = container.clientWidth / container.clientHeight;
            canvas.style.width = `100%`;
            canvas.style.height = `${(containerRatio / canvasRatio) * 100}%`;

            canvas.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
            });
        });
    }
}