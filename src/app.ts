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

    sections = config.Sections;

    async created(){
        this.$store.dispatch('getDevices');
    }

    switchSection(sectionIndex: number){
        const oldSection = this.sections.find((x: any) => x.status === 'active');
        oldSection.status = '';
        this.sections[sectionIndex].status = 'active';
    }
}