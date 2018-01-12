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

    get isActive(){
        return this.$store.state.voyeur.isActive;
    }

    get activeState(){
        return this.$store.state.session.activeState;
    }

    mounted(){
        this.intervalTimer = window.setInterval(async () => {
            const result = await fetch(`${config.BaseUrl}/session/client_seen?app=VOYEUR`, { credentials: 'include' });

            if(!result.ok){
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

    async acceptReservation(){

        await this.$store.dispatch<RequestPayload>({
            type: 'startRequest',
            performer: this.availableReservation,
            sessionType: SessionType.Video,
            fromVoyeur: true,
            ivrCode: this.$store.state.voyeur.ivrCode
        });

        this.$store.dispatch('succesMessage', 'voyeur.alerts.succesAddedreserve');
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

        await this.$store.dispatch('initiate');

        this.$router.push({
            name: 'Videochat',
            params: {
                id: activePerformer.advert_numbers[0].advertNumber.toString()
            }
        });
    }
}
