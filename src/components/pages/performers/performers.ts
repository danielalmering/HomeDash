import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';


import './performers.scss';

interface Performer {
    id: number;
    performer_services: { [key: string]: boolean }
};

@Component({
    template: require('./performers.tpl.html')
})
export default class Performers extends Vue {

    performers: Performer[] = [];

    hasService(performerId: number, service: string){
        const performer = this.performers.find(p => p.id === performerId);

        return !performer ? false : performer.performer_services[service];
    }

    mounted(){
        this.loadPerformers();
    }

    async loadPerformers(){
        const performerResults = await fetch('https://www.thuis.nl/api/performer/performer_accounts?limit=40&offset=0');

        this.performers = (await performerResults.json()).performerAccounts;
    }
}