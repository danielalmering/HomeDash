import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
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

    query: { limit: number, offset: number, category?: string, search?: string } = {
        limit: 40,
        offset: 0,
        category: '',
        search: ''
    }

    hasService(performerId: number, service: string){
        const performer = this.performers.find(p => p.id === performerId);

        return !performer ? false : performer.performer_services[service];
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.query.category = to.params.category ? to.params.category : '';
        this.query.search = to.query.search ? to.query.search : '';

        console.log('Route change');
        console.log(to);
        console.log(this.$route.query.search);

        this.loadPerformers();
    }

    mounted(){
        this.query.category = this.$route.params.category ? this.$route.params.category : '';
        this.query.search = this.$route.query.search ? this.$route.query.search : '';

        this.loadPerformers();
    }

    pageChanged(){
        this.loadPerformers();
    }

    async loadPerformers(){
        const performerResults = await fetch(`https://www.thuis.nl/api/performer/performer_accounts?limit=${this.query.limit}&offset=${this.query.offset}&category=${this.query.category}&search=${this.query.search}`);
        const data = await performerResults.json();

        this.performers = data.performerAccounts;
        this.total = data.total;
    }
}