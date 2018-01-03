import { Component, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import { Performer, PerformerStatus } from '../../../../models/Performer';
import { openModal, openRoute, getAvatarImage, getPerformerStatus } from '../../../../util';
import config from '../../../../config';

import './sidebar.scss';
import JSMpeg from '../../videochat/streams/jsmpeg';
import { RequestPayload } from '../../../../store/session';
import { SessionType } from '../../../../models/Sessions';
import notificationSocket from '../../../../socket';
import WithRender from './sidebar.tpl.html';
import { SocketServiceEventArgs, SocketStatusEventArgs } from '../../../../models/Socket';

type SidebarCategory = 'recommended' | 'peek' | 'favourites' | 'voyeur';

@WithRender
@Component({
    components: {
        jsmpeg: JSMpeg
    }
})
export default class Sidebar extends Vue {

    performers: Performer[] = [];
    category: SidebarCategory = 'recommended';
    services: string[] = ["cam", "phone", "sms", "email", "videocall"];
    toggleUserinfo: boolean = true;

    openModal = openModal;
    openRoute = openRoute;
    getAvatarImage = getAvatarImage;
    getPerformerStatus = getPerformerStatus;

    query: any = {
        limit: 20,
        offset: 0,
        performer: 0,
        search: ''
    };

    serviceEventId: number;
    statusEventId: number;

    categoryLoads = {
        'recommended': this.loadRecommended,
        'favourites': this.loadFavorites,
        'peek': this.loadPeek
    };

    get displaySidebar(){
        return this.$store.state.displaySidebar;
    }

    get logo(){
        return this.$store.getters.getLogoLight;
    }

    get authenticated(){
        return this.$store.getters.isLoggedIn;
    }

    get user(){
        return this.$store.state.authentication.user;
    }

    get voyeurTiles(){
        return this.$store.state.voyeur.activeTiles;
    }

    get isVoyeurActive(){
        return this.$store.state.voyeur.isActive;
    }

    get performer(){
        return (id: number) => {
            return this.$store.getters['voyeur/performer'](id);
        }
    }

    get isReserved(){
        return (id: number) => {
            this.$store.getters['voyeur/reservations'].indexOf(id) > -1;
        }
    }

    @Watch('isVoyeurActive')
    onVoyeurStateChange(newValue: boolean){
        //When voyeur gets activated switch the voyeur tab, when the session ends, switch back
        this.setCategory(newValue ? 'voyeur' : 'recommended');
    }

    mounted(){
        this.query.performer = this.$route.params.id;
        this.loadPerformers();

        this.serviceEventId = notificationSocket.subscribe('service', (data: SocketServiceEventArgs) => {
            const performer = this.performers.find(p => p.id === data.performerId);

            if(!performer || this.category === 'voyeur'){
                return;
            }

            performer.performer_services[data.serviceName] = data.serviceStatus;
        });

        this.statusEventId = notificationSocket.subscribe('status', (data: SocketStatusEventArgs) => {
            const performer = this.performers.find(p => p.id === data.performerId);

            if(!performer || this.category === 'voyeur'){
                return;
            }

            performer.performerStatus = data.status as PerformerStatus;
        });
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        if(this.displaySidebar){
            this.$store.commit('toggleSidebar');
        }
    }

    toggleSidebar(check: boolean){
        this.$store.commit('toggleSidebar');
    }

    hasService(performerId: number, service: string){
        const performer = this.performers.find(p => p.id === performerId);

        return !performer ? false : performer.performer_services[service];
    }

    reserve(performerId: number){
        this.isReserved(performerId) ?
            this.$store.commit('voyeur/removeReservation', performerId) :
            this.$store.commit('voyeur/addReservation', performerId);
    }

    async startVideoChat(performerId: number){
        await this.$store.dispatch<RequestPayload>({
            type: 'startRequest',
            performer: this.performer(performerId),
            sessionType: SessionType.Video,
            fromVoyeur: true,
            ivrCode: this.$store.state.voyeur.ivrCode
        });
    }

    async goToPerformer(performer: Performer){
        const session = this.$store.state.session;

        //peek with another lady if you're currently peeking and the lady is peekable
        if (this.category === 'peek' && session.activeSessionType == SessionType.Peek){
            try {
                await this.$store.dispatch('switchPeek', performer);
            } catch(e){
                this.$store.dispatch('errorMessage', 'sidebar.alerts.errorSwitchFailed');
            }

            this.$router.push({
                name: 'Videochat',
                params: {
                    id: performer.advert_numbers[0].advertNumber.toString()
                }
            });

            return;
        }

        this.$router.push({
            name: 'Profile',
            params: {
                id: performer.advert_numbers[0].advertNumber.toString()
            }
        });
    }

    onScroll(event: Event){
        if(!event.srcElement){
            return;
        }

        const element = event.srcElement;

        const isAtBottom = (element.scrollTop + element.clientHeight) === element.scrollHeight;

        if(isAtBottom){
            this.query.offset += 20;

            this.loadPerformers(true);
        }
    }

    search(){
        this.query.offset = 0;
        this.loadPerformers();
    }

    setCategory(category: SidebarCategory){
        if(this.category === category){
            return;
        }

        this.category = category;

        this.query.offset = 0;
        this.loadPerformers();
    }

    swap(performerId: number){
        this.$store.dispatch('voyeur/swap', {
            performerId: performerId
        });
    }

    beforeDestroy(){
        if(this.displaySidebar){
            this.$store.commit('toggleSidebar');
        }

        notificationSocket.unsubscribe(this.serviceEventId);
        notificationSocket.unsubscribe(this.statusEventId);
    }

    async loadPerformers(loadMore: boolean = false){
        if(this.category === 'voyeur'){
            return;
        }

        const data = await this.categoryLoads[this.category]();

        if(loadMore){
            this.performers = this.performers.concat(data.performerAccounts);
        } else {
            this.performers = data.performerAccounts;
        }
    }

    async loadRecommended() {
        const performerResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/recommended?limit=${this.query.limit}&offset=${this.query.offset}&performer=${this.query.performer}${this.query.search !== '' ? '&search=' : '' }${this.query.search}`, {
            credentials: 'include'
        });

        return performerResults.json();
    }

    async loadFavorites(){
        const userId = this.$store.state.authentication.user.id;

        const performerResults = await fetch(`${config.BaseUrl}/client/client_accounts/${userId}/favorite_performers?limit=${this.query.limit}&offset=${this.query.offset}&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });

        return performerResults.json();
    }

    async loadPeek(){
        const performerResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/busy?limit=${this.query.limit}&offset=${this.query.offset}&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });

        return performerResults.json();
    }
}