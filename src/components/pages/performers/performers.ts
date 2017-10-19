import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Pagination from '../../layout/Pagination';

import './performers.scss';

interface Performer {
    id: number;
    performer_services: { [key: string]: boolean }
};

@Component({
    template: require('./performers.tpl.html'),
    components: {
        pagination: Pagination
    }
})
export default class Performers extends Vue {

    performers: Performer[] = [];

    total: number = 0;

    query: { limit: number, offset: number, category: string } = {
        limit: 40,
        offset: 0,
        category: ''
    }

    hasService(performerId: number, service: string){
        const performer = this.performers.find(p => p.id === performerId);

        return !performer ? false : performer.performer_services[service];
    }

    mounted(){
        this.query.category = this.$route.params.category ? this.$route.params.category : '';

        this.loadPerformers();

        console.log(this.$route);
    }

    pageChanged(){
        this.loadPerformers();
    }

    async loadPerformers(){
        const performerResults = await fetch(`https://www.thuis.nl/api/performer/performer_accounts?limit=${this.query.limit}&offset=${this.query.offset}&category=${this.query.category}`);
        const data = await performerResults.json();

        this.performers = data.performerAccounts;
        this.total = data.total;
    }
}