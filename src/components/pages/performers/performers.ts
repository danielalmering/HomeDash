import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import Pagination from '../../layout/Pagination';
import notificationSocket from '../../../socket';
import { Performer, PerformerStatus } from '../../../models/Performer';
import { getAvatarImage } from '../../../util';
import config from '../../../config';

import './performers.scss';

@Component({
    template: require('./performers.tpl.html'),
    components: {
        pagination: Pagination
    }
})
export default class Performers extends Vue {

    performers: Performer[] = new Array(40).fill(undefined, 0, 40);
    // performers: Performer[] = [];

    total: number = 0;

    getAvatarImage = getAvatarImage;

    addFavourite = (performer: Performer) => this.$store.dispatch('addFavourite', performer.id).then(() => performer.isFavourite = true);
    removeFavourite = (performer: Performer) => this.$store.dispatch('removeFavourite', performer.id).then(() => performer.isFavourite = false);

    query: { limit: number, offset: number, category?: string, search?: string } = {
        limit: 40,
        offset: 0,
        category: '',
        search: ''
    }

    serviceEventId: number;
    statusEventId: number;

    hasService(performerId: number, service: string){
        const performer = this.performers.find(p => p.id === performerId);

        return !performer ? false : performer.performer_services[service];
    }

    performerStatus(performer: Performer){
        if(performer.performerStatus === PerformerStatus.Available){
            return 'available';
        }

        if(performer.performerStatus === PerformerStatus.OnCall ||
            performer.performerStatus === PerformerStatus.Busy){
            return performer.performer_services['peek'] ? 'peek' : 'busy';
        }

        return 'offline';
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.query.category = to.params.category ? to.params.category : '';
        this.query.search = to.query.search ? to.query.search : '';

        this.query.offset = to.query.page ? (parseInt(to.query.page) - 1) * this.query.limit : 0;

        this.loadPerformers();
    }

    mounted(){
        console.log(this.performers);

        this.query.category = this.$route.params.category ? this.$route.params.category : '';
        this.query.search = this.$route.query.search ? this.$route.query.search : '';

        this.loadPerformers();

        this.serviceEventId = notificationSocket.subscribe('service', (data) => {
            const performer = this.performers.find(p => p.id === data.performerId);

            if(!performer){
                return;
            }

            performer.performer_services[data.serviceName] = data.serviceStatus;
        });

        this.statusEventId = notificationSocket.subscribe('status', (data) => {
            const performer = this.performers.find(p => p.id === data.performerId);

            if(!performer){
                return;
            }

            performer.performerStatus = data.status;
        });
    }

    destroyed(){
        notificationSocket.unsubscribe(this.serviceEventId);
        notificationSocket.unsubscribe(this.statusEventId);
    }

    countriesList(countries: string){
        return countries.split(";").slice(0,-1)
    }

    pageChanged(){
        this.$router.push({ name: this.$route.name, query: { page: ((this.query.offset / this.query.limit) + 1).toString() } });
    }

    isSafeMode(){
        return this.$store.state.safeMode;
    }

    async loadPerformers(){
        const performerResults = await fetch(`${config.BaseUrl}/performer/performer_accounts?limit=${this.query.limit}&offset=${this.query.offset}&category=${this.query.category}&search=${this.query.search}`, {
            credentials: 'include'
        });

        if(performerResults.status !== 200){
            this.$router.push({ name: 'Performers' });
        }

        const data = await performerResults.json();

        this.performers = data.performerAccounts;
        this.total = data.total;
    }
}