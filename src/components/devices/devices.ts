import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import config from './../../config';
import VueSlider from 'vue-slider-component';

import 'whatwg-fetch';

import './devices.scss';
import 'vue-slider-component/theme/default.css';
import WithRender from './devices.tpl.html';

@WithRender
@Component({
    components: {
        vueSlider: VueSlider,
    }
})
export default class Devices extends Vue {


    get devices(){
        return this.$store.state.devices.devices;
    }

    get icon(){
        return (device: any) => {
            let icon = '';
            if(device.SwitchType === 'Dimmer'
            || device.SwitchType === 'Media Player'
            || device.SwitchType === 'On/Off'
            || device.SwitchType === 'Selector'){
                switch (device.Image) {
                    case 'Light':         icon = 'fa-lightbulb-o'; break;
                    case 'Alarm':         icon = 'fa-bell'; break;
                    case 'Amplifier':     icon = 'fa-bullhorn'; break;
                    case 'ChristmasTree': icon = 'fa-tree'; break;
                    case 'Computer':      icon = 'fa-laptop'; break;
                    case 'ComputerPC':    icon = 'fa-desktop'; break;
                    case 'Cooling':       icon = 'fa-snowflake-o'; break;
                    case 'Fan':           icon = 'fa-refresh'; break;
                    case 'Fireplace':     icon = 'fa-fire'; break;
                    case 'Generic':       icon = 'fa-power-off'; break;
                    case 'Harddisk':      icon = 'fa-hdd-o'; break;
                    case 'Heating':       icon = 'fa-thermometer-full'; break;
                    case 'Media':         icon = 'fa-youtube-play'; break;
                    case 'Phone':         icon = 'fa-mobile'; break;
                    case 'Printer':       icon = 'fa-print'; break;
                    case 'Speaker':       icon = 'fa-volume-up'; break;
                    case 'TV':            icon = 'fa-television'; break;
                    case 'WallSocket':    icon = 'fa-plug'; break;
                    case 'Water':         icon = 'fa-tint'; break;
                    default:
                }
            } else {
                switch (device.SwitchType) {
                    case 'Blinds':                      icon = 'fa-bars'; break;
                    case 'Blinds Inverted':             icon = 'fa-bars'; break;
                    case 'Blinds Percentage':           icon = 'fa-bars'; break;
                    case 'Blinds Percentage Inverted':  icon = 'fa-bars'; break;
                    case 'Contact':                     icon = 'fa-exchange'; break;
                    case 'Door Lock':                   icon = 'fa-lock'; break;
                    case 'Doorbell':                    icon = 'fa-bell-o'; break;
                    case 'Dusk Sensor':                 icon = 'fa-sun-o'; break;
                    case 'Motion Sensor':               icon = 'fa-assistive-listening-systems'; break;
                    case 'Push Off Button':             icon = 'fa-toggle-off'; break;
                    case 'Push On Button':              icon = 'fa-toggle-on'; break;
                    case 'Smoke Detector':              icon = 'fa-cloud'; break;
                    case 'Venetian Blinds EU':          icon = 'fa-bars'; break;
                    case 'Venetian Blinds US':          icon = 'fa-bars'; break;
                    case 'X10 Siren':                   icon = 'fa-bullhorn'; break;
                    default:
                }
            }

            return icon;
        };
    }

    async switchDevice(device: any){
        try {
            await this.$store.dispatch('switchDevice', device);
        } catch(e){
            return;
        }
    }

    async dimDevice(device: any){
        await this.$store.dispatch('dimDevice', {id: device.idx, level: device.Level});
    }
}