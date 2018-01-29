import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import Pagination from '../../layout/Pagination.vue';
import notificationSocket from '../../../socket';
import { getAvatarImage, getPerformerStatus, getPerformerLabel } from '../../../util';
import config from '../../../config';

import './performers.scss';
import { SocketServiceEventArgs, SocketStatusEventArgs } from '../../../models/Socket';
import WithRender from './performers.tpl.html';
import { RawLocation } from 'vue-router/types/router';
import { listPerformers } from 'SenseJS/performer/performer';
import { Performer, PerformerStatus } from 'SenseJS/performer/performer.model';
import { addFavourite, removeFavourite } from 'SenseJS/performer/favourite';

@WithRender
@Component({
    components: {
        pagination: Pagination
    }
})
export default class Performers extends Vue {

    performers: Performer[] = new Array(40).fill(undefined, 0, 40);

    total: number = 0;
    services: string[] = ['cam', 'phone', 'sms', 'email', 'videocall'];

    getAvatarImage = getAvatarImage;
    getPerformerStatus = getPerformerStatus;
    getPerformerLabel = getPerformerLabel;

    addFavourite = (performer: Performer) => addFavourite(this.$store.state.authentication.user.id, performer.id).then(() => performer.isFavourite = true);
    removeFavourite = (performer: Performer) => removeFavourite(this.$store.state.authentication.user.id, performer.id).then(() => performer.isFavourite = false);

    query: { limit: number, offset: number, category?: string, search: string } = {
        limit: 40,
        offset: 0,
        category: '',
        search: ''
    };

    serviceEventId: number;
    statusEventId: number;

    get noPerformers(){
        return this.performers.length === 0;
    }

    hasService(performerId: number, service: string){
        const performer = this.performers.find(p => p.id === performerId);

        return !performer ? false : performer.performer_services[service];
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.query.category = to.params.category ? to.params.category : '';
        this.query.search = to.query.search ? to.query.search : '';

        this.query.offset = to.query.page ? (parseInt(to.query.page) - 1) * this.query.limit : 0;

        this.loadPerformers();
    }

    mounted(){
        this.query.category = this.$route.params.category ? this.$route.params.category : '';
        this.query.search = this.$route.query.search ? this.$route.query.search : '';

        this.query.offset = this.$route.query.page ? (parseInt(this.$route.query.page) - 1) * this.query.limit : 0;

        this.loadPerformers();

        this.serviceEventId = notificationSocket.subscribe('service', (data: SocketServiceEventArgs) => {
            const performer = this.performers.find(p => p && p.id === data.performerId);

            if(!performer){
                return;
            }

            performer.performer_services[data.serviceName] = data.serviceStatus;
        });

        this.statusEventId = notificationSocket.subscribe('status', (data: SocketStatusEventArgs) => {
            const performer = this.performers.find(p => p && p.id === data.performerId);

            if(!performer){
                return;
            }

            performer.performerStatus = data.status as PerformerStatus;
        });
    }

    destroyed(){
        notificationSocket.unsubscribe(this.serviceEventId);
        notificationSocket.unsubscribe(this.statusEventId);
    }

    countriesList(countries: string){
        return countries.split(';').slice(0, -1);
    }

    pageChanged(){
        const route: RawLocation = {
            name: this.$route.name,
            query: { page: ((this.query.offset / this.query.limit) + 1).toString() },
            params: { category: this.query.category || '' }
        };

        //Add this to trigger a route change when the user changes the performer limit but the current page doesnt change
        if(this.query.limit !== this.performers.length && route.query){
            route.query.resultsPerPage = this.query.limit.toString();
        }

        if(route.query && this.query.search !== ''){
            route.query.search = this.query.search;
        }

        this.$router.push(route);
    }

    isSafeMode(){
        return this.$store.state.safeMode;
    }

    async loadPerformers(){
        //Makes the tiles load when switching pages
        this.performers = new Array(this.query.limit).fill(undefined, 0, this.query.limit);

        const { result, error } = await listPerformers(this.query);

        if(error){
            this.$router.push({ name: 'Performers' });
        }

        this.performers = result.performerAccounts;
        this.total = result.total;
    }
}