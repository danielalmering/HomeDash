import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import config from './../../config';

import moment from 'moment';

import 'whatwg-fetch';

import './weather.scss';
import WithRender from './weather.tpl.html';

@WithRender
@Component
export default class Weather extends Vue {

    interval: any;
    intervalTime: number = 60000;

    weather: any = [];
    time: any = moment().format('HH:mm');

    get date(){
        return (stamp: number) => {
            return moment.unix(stamp).format('DD-MM-YYYY');
        };
    }

    get dayWeek(){
        return (stamp: number) => {
            const options = { weekday: 'long' };
            const date = moment.unix(stamp).toDate();
            return date.toLocaleDateString(`${config.Weather_country}-${config.Weather_country.toUpperCase()}`, options);
        };
    }

    get icon(){
        return (url: string) => {
            const section = url.split('/', 6).pop();
            const name = url.split('/').pop();
            return require(`../../assets/images/weather/${section}/${name}`);
        };
    }

    mounted(){
        this.getWeather();

        // Start Timer
        this.interval = setInterval(() => {
            this.getWeather();
            this.time = moment().format('HH:mm');
        }, this.intervalTime);
    }

    async getWeather(){
        const api = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${config.Weather_api}&q=${config.Weather_location}&days=4`, {
            credentials: 'same-origin',
        });

        if(!api.ok){ return; }

        const result = await api.json();
        this.weather = result;
    }

    beforeDestroy() {
        clearInterval(this.interval);
    }
}