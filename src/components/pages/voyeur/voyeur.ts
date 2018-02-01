import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../config';
import JSMpeg from '../videochat/streams/jsmpeg';
import NanoCosmos from '../videochat/streams/nanocosmos';
import Confirmation from '../../layout/Confirmations.vue';

import './voyeur.scss';
import { SessionType, State } from '../../../models/Sessions';
import { RequestPayload } from '../../../store/session/';
import { Performer } from '../../../models/Performer';
import WithRender from './voyeur.tpl.html';

@WithRender
@Component({
    components: {
        jsmpeg: JSMpeg,
        nanocosmos: NanoCosmos,
        confirmation: Confirmation
    }
})
export default class Voyeur extends Vue {

    intervalTimer: number;
    showFavo: boolean = false;
    showReserve: boolean = false;

    removeFavourite = (performer: Performer) => this.$store.dispatch('removeFavourite', performer.id).then(() => performer.isFavourite = false);

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
            return this.$store.getters['voyeur/reservations'].indexOf(id) > -1;
        };
    }

    mounted(){
        this.intervalTimer = window.setInterval(async () => {
            const result = await fetch(`${config.BaseUrl}/session/client_seen?app=VOYEUR`, { credentials: 'include' });

            if(!result.ok){
                this.close();
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
        console.log(`yoyo dit is de state: ${state}`);
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
                id: activePerformer.advert_numbers[0].advertNumber.toString()
            }
        });
    }
}
