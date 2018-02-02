import { Component, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import { Performer, PerformerStatus } from '../../../../models/Performer';
import { openModal, openRoute, getAvatarImage, getPerformerStatus, isInSession, isOutOfSession } from '../../../../util';
import config from '../../../../config';

import './sidebar.scss';
import JSMpeg from '../../videochat/streams/jsmpeg';
import NanoCosmos from '../../videochat/streams/nanocosmos';
import { RequestPayload } from '../../../../store/session/';
import { SessionType, State } from '../../../../models/Sessions';
import notificationSocket from '../../../../socket';
import WithRender from './sidebar.tpl.html';
import { SocketServiceEventArgs, SocketStatusEventArgs } from '../../../../models/Socket';

type SidebarCategory = 'recommended' | 'peek' | 'favourites' | 'voyeur';

@WithRender
@Component({
    components: {
        jsmpeg: JSMpeg,
        nanocosmos: NanoCosmos
    }
})
export default class Sidebar extends Vue {

    performers: Performer[] = [];
    category: SidebarCategory = 'recommended';
    services: string[] = ['cam', 'phone', 'sms', 'email', 'videocall'];
    toggleUserinfo: boolean = true;

    openModal = openModal;
    openRoute = openRoute;
    getAvatarImage = getAvatarImage;
    getPerformerStatus = getPerformerStatus;
    isOutOfSession = isOutOfSession;

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

    addFavourite = (performer: Performer) => this.$store.dispatch('addFavourite', performer.id).then(() => performer.isFavourite = true);
    removeFavourite = (performer: Performer) => this.$store.dispatch('removeFavourite', performer.id).then(() => performer.isFavourite = false);

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
        return (id: number): Performer  => {
            return this.$store.getters['voyeur/performer'](id);
        };
    }

    get isReserved(){
        return (id: number) => {
            return this.$store.getters['voyeur/isReservation'](id);
        };
    }

    @Watch('isVoyeurActive')
    onVoyeurStateChange(newValue: boolean){
        //When voyeur gets activated switch the voyeur tab, when the session ends, switch back
        this.setCategory(newValue ? 'voyeur' : 'recommended');
    }

    mounted(){
        this.query.performer = this.$route.params.id;
        this.loadPerformers();

        this.serviceEventId = notificationSocket.subscribe('service', async (data: SocketServiceEventArgs) => {
            if(this.category === 'voyeur'){
                return;
            }

            const performer = this.performers.find(p => p.id === data.performerId);

            //If the performer is in a session and turns of peeking, remove from list
            if(performer && isInSession(performer.performerStatus) &&
                data.serviceName === 'peek' && !data.serviceStatus &&
                this.category === 'peek'){

                this.performers = this.performers.filter(p => p.id !== data.performerId);
            }

            //If the performer is not in the list and turns on peeking while in a session, add her to the list
            if(!performer && data.serviceName === 'peek' &&
                data.serviceStatus && this.category === 'peek'){

                const newPerformer = await this.loadPerformer(data.performerId);

                if(!isInSession(newPerformer.performerStatus)){
                    return;
                }

                //Extra check because this can be triggered twice if the performer quickly goes online and offline
                if(!this.performers.find(p => p.id === data.performerId)){
                    this.performers.push(newPerformer);
                }

                return;
            }

            if(!performer){
                return;
            }

            performer.performer_services[data.serviceName] = data.serviceStatus;
        });

        this.statusEventId = notificationSocket.subscribe('status', async (data: SocketStatusEventArgs) => {
            if(this.category === 'voyeur'){
                return;
            }

            const performer = this.performers.find(p => p.id === data.performerId);

            //Check if the performer is in a session and doesn't exist in the list yet
            const didPerformerJoinSession = !performer && isInSession(data.status as PerformerStatus);

            //Check if the performer is not in a session and previously was
            const didPerformerLeaveSession = performer && isOutOfSession(data.status as PerformerStatus) && isInSession(performer.performerStatus);

            //If the performer is offline or or left the session, remove her from the list
            if(data.status === PerformerStatus.Offline || (didPerformerLeaveSession && this.category === 'peek')){
                this.performers = this.performers.filter(p => p.id !== data.performerId);
                return;
            }

            //If the performer started a session and she has peek enabled, add her to the list
            if(didPerformerJoinSession && this.category === 'peek'){
                const newPerformer = await this.loadPerformer(data.performerId);

                if(!newPerformer.performer_services['peek']){
                    return;
                }

                //Extra check because this can be triggered twice if the performer quickly goes online and offline
                if(!this.performers.find(p => p.id === data.performerId)){
                    this.performers.push(newPerformer);
                }

                return;
            }

            if(!performer){
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

        //Switch to the peek tab when starting a peek session
        if(to.name === 'Peek' && this.category !== 'peek'){

            this.setCategory('peek');
        }
    }

    toggleSidebar(check: boolean){
        this.$store.commit('toggleSidebar');
    }

    hasService(performerId: number, service: string){
        const performer = this.performers.find(p => p.id === performerId);

        return !performer ? false : performer.performer_services[service];
    }

    toggleFavourite(performerId: number){
        const performer = this.performer(performerId);

        performer.isFavourite ? this.removeFavourite(performer) : this.addFavourite(performer);
    }

    reserve(performerId: number){
        if(this.$store.state.session.activeState === 'pending'){
            return;
        }

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
            ivrCode: this.$store.state.voyeur.ivrCode,
            displayName: this.$store.state.voyeur.displayName
        });
    }

    async goToPerformer(performer: Performer){
        const session = this.$store.state.session;

        //peek with another lady if you're currently peeking and the lady is peekable
        if (this.category === 'peek' && session.activeState === State.Active && session.activeSessionType === SessionType.Peek){
            if(performer.id === session.activePerformer.id){
                return;
            }

            try {
                await this.$store.dispatch('switchPeek', performer);
            } catch(e){
                this.$store.dispatch('errorMessage', 'sidebar.alerts.errorSwitchFailed');
            }

            this.$router.push({
                name: 'Peek',
                params: {
                    id: session.activePerformer.advert_numbers[0].advertNumber.toString()
                }
            });

            return;
        }

        this.$router.push(this.$localize({
            name: 'Profile',
            params: {
                id: performer.advert_numbers[0].advertNumber.toString()
            }
        }));
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
        this.scrollToTop();

        this.query.offset = 0;
        this.loadPerformers();
    }

    setCategory(category: SidebarCategory){
        if(this.category === category){
            return;
        }

        this.category = category;

        this.scrollToTop();

        this.query.offset = 0;
        this.loadPerformers();
    }

    swap(performerId: number){
        this.$store.dispatch('voyeur/swap', {
            performerId: performerId
        });
    }

    scrollToTop(){
        const element = document.querySelector('.sidebar__performers');

        if(!element){
            return;
        }

        element.scrollTop = 0;
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

        this.performers = loadMore ? this.performers.concat(data.performerAccounts) : data.performerAccounts;
    }

    async loadPerformer(id: number): Promise<Performer> {
        const performerResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/${id}?data=1`, {
            credentials: 'include'
        });

        const data = await performerResults.json();

        return data.performerAccount as Performer;
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