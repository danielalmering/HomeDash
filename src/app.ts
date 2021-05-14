import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import config from './config';

import Weather from './components/weather/weather';
import Devices from './components/devices/devices';
import Cameras from './components/cameras/cameras';

import 'whatwg-fetch';

import WithRender from './app.tpl.html';

@WithRender
@Component({
    components: {
        weather: Weather,
        devices: Devices,
        cameras: Cameras
    }
})
export default class App extends Vue {

    colums = config.Colums;
    blocks = config.Blocks;

    colum1: any = [];
    colum2: any = [];
    colum3: any = [];

    mounted(){
        this.createBlocks();
    }

    async created(){
        this.$store.dispatch('getDevices');
    }

    createBlocks(){
        for (let i = 0; i < this.blocks.length; i++) {
            switch (this.blocks[i].colum) {
                case 'colum1':
                    this.colum1.push(this.blocks[i]);
                    break;
                case 'colum2':
                    this.colum2.push(this.blocks[i]);
                    break;
                case 'colum3':
                    this.colum3.push(this.blocks[i]);
                    break;
            }
        }
    }
}