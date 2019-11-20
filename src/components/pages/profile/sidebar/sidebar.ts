import { Component, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import {
    openModal,
    openRoute,
    getAvatarImage,
    getPerformerStatus,
    webrtcPossible,
    NanoCosmosPossible,
    hasService
} from '../../../../util';
import config, { logo } from '../../../../config';

import './sidebar.scss';
import JSMpeg from '../../videochat/streams/jsmpeg';
import NanoCosmos from '../../videochat/streams/nanocosmos';
import { RequestPayload } from '../../../../store/session/';
import { SessionType, State } from '../../../../models/Sessions';
import notificationSocket from '../../../../socket';
import WithRender from './sidebar.tpl.html';
import { SocketServiceEventArgs, SocketStatusEventArgs } from '../../../../models/Socket';
import { listRecommended, listBusy } from 'sensejs/performer';
import { listFavourites } from 'sensejs/performer/favourite';
import { Performer, PerformerStatus } from 'sensejs/performer/performer.model';
import { isInSession, isOutOfSession } from 'sensejs/util/performer';
import { addFavourite, removeFavourite } from 'sensejs/performer/favourite';
import {WebRTC} from "../../videochat/streams/webrtc";

const Platform = require('platform');


type SidebarCategory = 'recommended' | 'teasers' | 'peek' | 'favourites' | 'voyeur';


@WithRender
@Component({
    components: {
        jsmpeg: JSMpeg,
        nanocosmos: NanoCosmos,
        webrtc: WebRTC
    }
})
export default class Sidebar extends Vue {

    performers: Performer[] = [];
    defaultCategory: any = 'recommended'; // Toggle first tab, see categoryLoads!
    category: SidebarCategory = this.defaultCategory;
    services: string[] = ['cam', 'phone', 'sms', 'email', 'videocall'];
    toggleUserinfo: boolean = true;

    openModal = openModal;
    getAvatarImage = getAvatarImage;
    getPerformerStatus = getPerformerStatus;
    isOutOfSession = isOutOfSession;
    logo = logo;

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
        'teasers': this.loadTeasers,
        'favourites': this.loadFavorites,
        'peek': this.loadPeek
    };

    addFavourite = (performer: Performer) => addFavourite(this.$store.state.authentication.user.id, performer.id).then(() => performer.isFavourite = true);
    removeFavourite = (performer: Performer) => removeFavourite(this.$store.state.authentication.user.id, performer.id).then(() => performer.isFavourite = false);

    get displaySidebar(){
        return this.$store.state.displaySidebar;
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
        this.setCategory(newValue ? 'voyeur' : this.defaultCategory);
    }


    isWebRTCPerformer(performerId:number): boolean {
        //disable webrtc play by returning false here!
        //nst performerId = this.$store.state.voyeur.mainTile.performer;

        const performer = this.performer(performerId);

        if(performer == null){
            return false;
        }

        if(!performer && performer === undefined){
            return false;
        }

        if(!performer.mediaId  && performer.mediaId === undefined){
            return false;
        }

        return performer.mediaId == 2;
    }


    streamTransportType(performer:number): string | undefined{

        const platform = Platform.parse(navigator.userAgent);

        if(this.isWebRTCPerformer(performer)){
            if(webrtcPossible(platform)){
                return 'webrtc';
            } else {
                return 'jsmpeg';
            }

        }

        if(NanoCosmosPossible(platform)){
            return 'nanocosmos';
        }

        //fallback on nanocosmos
        return 'jsmpeg';
    }

    mounted(){
        this.query.performer = this.$route.params.id;
        this.loadPerformers();

        this.serviceEventId = notificationSocket.subscribe('service', async (data: SocketServiceEventArgs) => {
            if(this.category === 'voyeur'){
                return;
            }

            const performer = this.performers.find(p => p.id === data.performerId);

            //Temp for services map
            if(data.services){
                if(performer){
                    performer.performer_services = { ...performer.performer_services, ...data.services };
                }

                if(data.services['peek'] !== undefined){
                    data.serviceName = 'peek';
                    data.serviceStatus = data.services['peek'];
                }
            }

            if(performer && data.status){
                await statusSocketCb.bind(this)({
                    performerId: data.performerId,
                    status: data.status
                });
            }

            if(!data.serviceName){
                return;
            }

            //If the performer is in a session and turns of peeking, remove from list
            if(performer && isInSession(performer.performerStatus) &&
                data.serviceName === 'peek' && !data.serviceStatus &&
                this.category === 'peek'){

                this.performers = this.performers.filter(p => p.id !== data.performerId);
            }

            //If the performer is not in the list and turns on peeking while in a session, add her to the list
            if(!performer && data.serviceName === 'peek' &&
                data.serviceStatus === true && this.category === 'peek'){

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

        this.statusEventId = notificationSocket.subscribe('status', statusSocketCb.bind(this));

        async function statusSocketCb(data: SocketStatusEventArgs){
            if(this.category === 'voyeur'){
                return;
            }

            const performer = this.performers.find((p: Performer) => p.id === data.performerId);

            //Check if the performer is in a session and doesn't exist in the list yet
            const didPerformerJoinSession = !performer && isInSession(data.status as PerformerStatus);

            //Check if the performer is not in a session and previously was
            const didPerformerLeaveSession = performer && isOutOfSession(data.status as PerformerStatus) && isInSession(performer.performerStatus);

            //If the performer is offline or or left the session, remove her from the list
            if(data.status === PerformerStatus.Offline || (didPerformerLeaveSession && this.category === 'peek')){
                this.performers = this.performers.filter((p: Performer) => p.id !== data.performerId);
                return;
            }

            //If the performer started a session and she has peek enabled, add her to the list
            if(didPerformerJoinSession && this.category === 'peek'){
                const newPerformer = await this.loadPerformer(data.performerId);

                if(!newPerformer || !newPerformer.performer_services || !('peek' in newPerformer.performer_services) || !newPerformer.performer_services['peek']){
                    return;
                }

                //Extra check because this can be triggered twice if the performer quickly goes online and offline
                if(!this.performers.find((p: Performer) => p.id === data.performerId)){
                    this.performers.push(newPerformer);
                }

                return;
            }

            if(!performer){
                return;
            }

            performer.performerStatus = data.status as PerformerStatus;
        }
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

    openRoute(location: string){
        if(this.authenticated){
            this.$router.push({ name: location });
        }
    }

    toggleSidebar(check: boolean){
        this.$store.commit('toggleSidebar');
    }

    hasService(performerId: number, service: string){
        const performer = this.performers.find(p => p.id === performerId);

        return !performer ? false : hasService(performer, service);
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
        await this.$store.dispatch('startRequest', {
            performer: this.performer(performerId),
            sessionType: SessionType.Video,
            fromVoyeur: true,
            ivrCode: this.$store.state.voyeur.ivrCode,
            displayName: this.$store.state.voyeur.displayName
        });
    }

    async goToPerformer(performer: Performer, category: string){
        const session = this.$store.state.session;

        //peek with another lady if you're currently peeking and the lady is peekable
        if (this.category === 'peek' && session.activeState === State.Active && session.activeSessionType === SessionType.Peek){
            if(performer.id === session.activePerformer.id){
                return;
            }

            this.$store.commit('toggleSwitchModal', { state: true, performer });

            return;
        }

        this.$router.push({
            name: 'Profile',
            params: {
                id: performer.advertId.toString(),
                category: category
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
        const { result } = await listRecommended({
            ...this.query,
            search: this.query.search === '' ? undefined : this.query.search
        });

        return result;
    }

    async loadTeasers() {
        const query = {
            limit: 20,
            offset: 0,
            performer: this.query.performer,
            search: '',
            voyeur: 2
        };

        const { result } = await listBusy(query);

        return result;
    }

    async loadFavorites(){
        const userId = this.$store.state.authentication.user.id;
        const { result } = await listFavourites(userId, this.query);

        return result;
    }

    async loadPeek(){
        const { result } = await listBusy(this.query);

        return result;
    }
}
