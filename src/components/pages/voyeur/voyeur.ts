import { Component, Watch } from 'vue-property-decorator';
import Vue from 'vue';
import JSMpeg from '../videochat/streams/jsmpeg';
import NanoCosmos from '../videochat/streams/nanocosmos';
import Confirmation from '../../layout/confirmations/confirmations';

require('../../../../static/nanoplayer.4.5.6.min.js');

import './voyeur.scss';
import { SessionType, State } from '../../../models/Sessions';
import { RequestPayload } from '../../../store/session/';
import { Performer } from 'sensejs/performer/performer.model';
import WithRender from './voyeur.tpl.html';
import { clientSeen } from 'sensejs/session/index';
import { addFavourite, removeFavourite } from 'sensejs/performer/favourite';
import {NanoCosmosPossible, isIE} from '../../../utils/video.util';
import {WebRTC} from '../videochat/streams/webrtc';
import { JanusPlay } from '../videochat/streams/janus';
import { webrtcPublisher, clubsenseStreamerPublisher, janusPublisher } from '../videochat/videochat.publishers';
import { log, error, warn } from '../../../utils/main.util';
import config from '../../../config';

const Platform = require('platform');

@WithRender
@Component({
    components: {
        jsmpeg: JSMpeg,
        nanocosmos: NanoCosmos,
        webrtc: WebRTC,
        janus: JanusPlay,
        confirmation: Confirmation,
    }
})
export default class Voyeur extends Vue {

    intervalTimer: number;
    showFavo: boolean = false;
    showReserve: boolean = false;

    addFavourite = (performer: Performer) => addFavourite(this.$store.state.authentication.user.id, performer.id).then(() => performer.isFavourite = true);
    removeFavourite = (performer: Performer) => removeFavourite(this.$store.state.authentication.user.id, performer.id).then(() => performer.isFavourite = false);

    get mainTile(){
         //NOTE: Hotze This should not happen but it happens
        if(this.$store.state.voyeur.mainTile == undefined){
            error('Voyeur: mainTile is null or undefined');
            return false;
        }
        
        return this.$store.state.voyeur.mainTile;
    }

    get playServer(): string | undefined {
        if (!this.mainTile.streamData){
            return undefined;
        }

        if (this.streamTransportType === 'janus'){
            return config.Janus;
        }

        return this.mainTile.streamData.wowza;
    }

    get favoritePerformers(){
        return this.$store.getters['voyeur/favourites'];
    }

    get reservations(){
        return this.$store.getters['voyeur/reservations'];
    }

    get availableReservation(): Performer {
        return this.$store.getters['voyeur/availableReservations'][0];
    }

    get performerData(){
        const performerId = this.$store.state.voyeur.mainTile != undefined ? this.$store.state.voyeur.mainTile.performer  : this.$store.getters['voyeur/getReplacementPerformer'];
        return this.performer(performerId);
    }

    get performer(){
        return (id: number) => {

            const performer =  this.$store.getters['voyeur/performer'](id);
            //check if performer is found if not get a replacement
            if(performer === undefined) {
                const performerId = this.$store.getters['voyeur/getReplacementPerformer'];
                //if there are no replacements just close the voyeur
                if(performerId < 0) {
                    warn('Voyeur: closing voyeur no found replacement');
                    this.close();
                    return -1;
                } else {
                    log('swaping...');
                    this.swap(performerId);
                    return performerId;
                }
            }

            return performer;
        };
    }

    get isActive(){
        return this.$store.state.voyeur.isActive;
    }

    get activeState(){
        return this.$store.state.session.activeState;
    }

    get isReserved(){
        return (id: number) => {
            return this.$store.getters['voyeur/isReservation'](id);
        };
    }

    get streamTransportType(): string | undefined {
        const mainPerformer = this.performerData;

        if(mainPerformer === undefined || !mainPerformer){
            return undefined;
        }

        if (!mainPerformer.mediaId) {
            return undefined;
        }

        const playStream = mainPerformer.playStream ? mainPerformer.playStream : undefined;
        const platform = Platform.parse(navigator.userAgent);
        const mediaId = mainPerformer.mediaId;

        switch(mediaId) {
            case 0:
            case 1: // flash publisher
                return ((NanoCosmosPossible(platform) && !isIE(platform)) ? 'nanocosmos' : 'rtmp');
            case 2: //webrtc publisher
                return webrtcPublisher(platform, 'PEEK');
            case 3: // OBS publisher (clubsense streamer)
                return clubsenseStreamerPublisher(platform, 'PEEK');
            case 4:
                return janusPublisher(platform);
            default: //fallback encoder
                return 'jsmpeg';
        }
    }

    mounted(){
        this.intervalTimer = window.setInterval(async () => {
            const { error } = await clientSeen({
                app: 'VOYEUR'
            });

            if(error){
                close();
            }
        }, 5000);

        if(!this.isActive){
            this.$router.push({
                name: 'Profile',
                params: {
                    id: this.$route.params.id
                }
            });
        }
    }

    async close(){
        if(this.isActive){
            await this.$store.dispatch('voyeur/end');
        }

        this.$store.dispatch('errorMessage', 'voyeur.alerts.successChatEnded');

        this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });
    }


    beforeDestroy(){
        clearInterval(this.intervalTimer);

        if(!this.isActive){
            return;
        }

        //Kill session
        this.$store.dispatch('voyeur/end');
    }

    swap(performerId: number){
        log('going to swap');
        this.$store.dispatch('voyeur/swap', {
            performerId
        });
    }

    removeFavorite(performer: any){
        if(!performer){
            return;
        }

        this.removeFavourite(performer);
    }

    reserve(performerId: number){
        if(this.$store.state.session.activeState === 'pending'){
            return;
        }

        this.isReserved(performerId) ?
            this.$store.commit('voyeur/removeReservation', performerId) :
            this.$store.commit('voyeur/addReservation', performerId);
        this.showReserve = true;
    }

    toggleFavourite(performerId: number){
        const performer = this.performer(performerId);

        performer.isFavourite ? this.removeFavourite(performer) : this.addFavourite(performer);
        this.showFavo = true;
    }

    async removeReservation(performerId: number){
        if(!performerId){
            return;
        }

        this.$store.commit('voyeur/removeReservation', performerId);
    }

    async acceptReservation(){

        await this.$store.dispatch<RequestPayload>({
            type: 'startRequest',
            performer: this.availableReservation,
            sessionType: SessionType.Video,
            fromVoyeur: true,
            ivrCode: this.$store.state.voyeur.ivrCode,
            displayName: this.$store.state.voyeur.displayName
        });

        this.$store.dispatch('succesMessage', 'voyeur.alerts.succesAddedreserve');
    }

    cancelRequest(){
        this.$store.dispatch('cancel');
    }

    async cancelReservation(){
        this.$store.commit('voyeur/removeReservation', this.availableReservation.id);
    }

    async startVideoChat(performerId: number){
        //if performer is undefined or null stop the call
        if(this.performer(performerId) == undefined) {
            this.$store.dispatch('errorMessage', 'voyeur.alerts.errorPerformerNotAvailable');
            return;
        }

        await this.$store.dispatch<RequestPayload>({
            type: 'startRequest',
            performer: this.performer(performerId),
            sessionType: SessionType.Video,
            fromVoyeur: true,
            ivrCode: this.$store.state.voyeur.ivrCode,
            displayName: this.$store.state.voyeur.displayName
        });
    }

    viewerStateChange(state: string){
       // console.log(`yoyo dit is de state: ${state}`);
    }

    async viewerError(message: string){
        warn('viewer error', message);
        const performerId = this.$store.getters['voyeur/getReplacementPerformer'];
        this.swap(performerId);
    }

    @Watch('mainTile')
    async switcheroo(newState: boolean){
        log('main tile changed', newState);
        if(newState === undefined) {
            //ended or switch ?
            this.close();
        }
    }

    @Watch('isActive')
    activeChange(newState: boolean){
        if(!newState){
            this.close();
        }
    }

    @Watch('activeState')
    async stateChange(newState: State){
        const activePerformer = this.$store.state.session.activePerformer as Performer;

        if(this.availableReservation && activePerformer.id === this.availableReservation.id){
            this.cancelReservation();
        }

        if(newState !== State.Accepted){
            return;
        }

        // Close voyeur session first, this changes the isActive state to false and should trigger the close() function
        // This doesn't happen tho because before it gets a chance we go to another component and this one gets broken down
        await this.$store.dispatch('voyeur/end');

        await this.$store.dispatch('initiate');

        this.$router.push({
            name: 'Videochat',
            params: {
                id: activePerformer.advertId.toString()
            }
        });
    }
}
