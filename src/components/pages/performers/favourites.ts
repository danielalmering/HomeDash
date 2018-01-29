import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import Pagination from '../../layout/Pagination.vue';
import Performers from './performers';
import { listFavourites } from 'SenseJS/performer/favourite';
import config from '../../../config';

import './performers.scss';
import WithRender from './performers.tpl.html';

@WithRender
@Component({
    components: {
        pagination: Pagination
    }
})
export default class Favourites extends Performers {

    async loadPerformers(){
        const userId = this.$store.state.authentication.user.id;

        const { result } = await listFavourites(userId);

        this.performers = result.performerAccounts;
        this.total = result.total;

        console.log(this.performers);
    }
}