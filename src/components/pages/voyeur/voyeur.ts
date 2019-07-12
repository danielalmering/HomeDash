import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../config';
import JSMpeg from '../videochat/streams/jsmpeg';
import NanoCosmos from '../videochat/streams/nanocosmos';
import Confirmation from '../../layout/Confirmations.vue';

require('../../../../static/nanoplayer.3.min.js');

import './voyeur.scss';
import { SessionType, State } from '../../../models/Sessions';
import { RequestPayload } from '../../../store/session/';
import { Performer } from 'sensejs/performer/performer.model';
import WithRender from './voyeur.tpl.html';
import { clientSeen } from 'sensejs/session/index';
import { addFavourite, removeFavourite } from 'sensejs/performer/favourite';
import {NanoCosmosPossible, webrtcPossible} from "../../../util";
import {WebRTC} from "../videochat/streams/webrtc";


const Platform = require('platform');

@WithRender
@Component({
    components: {
        jsmpeg: JSMpeg,
        nanocosmos: NanoCosmos,
        webrtc: WebRTC,
        confirmation: Confirmation
    }
})
export default class Voyeur extends Vue {

    intervalTimer: number;
    showFavo: boolean = false;
    showReserve: boolean = false;

    addFavourite = (performer: Performer) => addFavourite(this.$store.state.authentication.user.id, performer.id).then(() => performer.isFavourite = true);
    removeFavourite = (performer: Performer) => removeFavourite(this.$store.state.authentication.user.id, performer.id).then(() => performer.isFavourite = false);

    get mainTile(){
        return this.$store.state.voyeur.mainTile;
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
        const performerId = this.$store.state.voyeur.mainTile.performer;

        return this.$store.getters['voyeur/performer'](performerId);
    }

    get performer(){
        return (id: number) => {
            return this.$store.getters['voyeur/performer'](id);
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


    get isWebRTCPerformer(): boolean {
        //disable webrtc play by returning false here!
        const performerId = this.$store.state.voyeur.mainTile.performer;
        const activePerformer = this.performer(performerId);

        if(activePerformer == null){
            return false;
        }

        if(!activePerformer && activePerformer === undefined){
            return false;
        }

        if(!activePerformer.mediaId  && activePerformer.mediaId === undefined){
            return false;
        }

        return activePerformer.mediaId > 1;
    }


    get streamTransportType(): string | undefined{

        const platform = Platform.parse(navigator.userAgent);

        //for webrtc user use webrtc viewer or jsmpeg
        if(this.isWebRTCPerformer){
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

    viewerError(message: string){
        console.log(message);
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
