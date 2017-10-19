import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import Pagination from '../../layout/Pagination';
import Performers from './performers';

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
export default class Favourites extends Performers {

    async loadPerformers(){
        const userId = this.$store.state.authentication.user.id;

        const performerResults = await fetch(`https://www.thuis.nl/api/client/client_accounts/${this.$store.state.authentication.user.id}/favorite_performers?limit=${this.query.limit}&offset=${this.query.offset}`, {
            credentials: 'include'
        });
        const data = await performerResults.json();

        this.performers = data.performerAccounts;
        this.total = data.total;
    }
}