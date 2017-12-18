import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../config';
import JSMpeg from '../videochat/streams/jsmpeg';
import Confirmation from '../../layout/Confirmations.vue';

import './voyeur.scss';
import { SessionType, State } from '../../../models/Sessions';
import { RequestPayload } from '../../../store/session';
import { Performer } from '../../../models/Performer';

@Component({
    template: require('./voyeur.tpl.html'),
    components: {
        jsmpeg: JSMpeg,
        confirmation: Confirmation
    }
})
export default class Voyeur extends Vue {

    intervalTimer: number;

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

    get performer(){
        return (id: number) => {
            return this.$store.getters['voyeur/performer'](id);
        };
    }

    get activeState(){
        return this.$store.state.session.activeState;
    }

    mounted(){
        this.intervalTimer = setInterval(async () => {
            await fetch(`${config.BaseUrl}/session/client_seen?app=VOYEUR`, { credentials: 'include' });
        }, 5000);

        if(!this.$store.state.voyeur.isActive){
            this.$router.push({
                name: 'Profile',
                params: {
                    id: this.$route.params.id
                }
            });
        }
    }

    beforeDestroy(){
        clearInterval(this.intervalTimer);

        if(!this.$store.state.voyeur.isActive){
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

    async acceptReservation(){
        await this.$store.dispatch<RequestPayload>({
            type: 'startRequest',
            performer: this.availableReservation,
            sessionType: SessionType.Video,
        });
    }

    cancelRequest(){
        this.$store.dispatch('cancel');
    }

    async cancelReservation(){
        this.$store.commit('voyeur/removeReservation', this.availableReservation.id);
    }

    viewerStateChange(state: string){
        console.log(`yoyo dit is de state: ${state}`);
    }

    viewerError(message: string){
        console.log(message);
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

        await this.$store.dispatch('initiate');

        this.$router.push({
            name: 'Videochat',
            params: {
                id: activePerformer.advert_numbers[0].advertNumber.toString()
            }
        });
    }
}