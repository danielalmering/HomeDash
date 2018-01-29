import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import { openModal, getAvatarImage, getPerformerLabel  } from '../../../util';
import { RequestPayload, SessionState } from '../../../store/session/';
import { SessionType, State, PaymentType } from '../../../models/Sessions';

import PhotoSlider from './photo-slider.vue';
import FullSlider from './photo-slider-fullscreen.vue';
import Tabs from './tabs/tabs';
import config from '../../../config';

import notificationSocket from '../../../socket';
import { SocketServiceEventArgs, SocketStatusEventArgs } from '../../../models/Socket';
import Confirmation from '../../layout/Confirmations.vue';
import { setTitle, setDescription, setKeywords, setGraphData } from '../../../seo';

import { getByAdvert } from 'SenseJS/performer/performer';

import './profile.scss';
import './photo-slider.scss';
import WithRender from './profile.tpl.html';
import { Performer, PerformerStatus, PerformerAvatar } from 'SenseJS/performer/performer.model';
import { createReservation } from 'SenseJS/session';
import { removeFavourite, addFavourite } from 'SenseJS/performer/favourite';

@WithRender
@Component({
    components: {
        photoSlider: PhotoSlider,
        photoSliderFull: FullSlider,
        tabs: Tabs,
        confirmation: Confirmation
    },
    filters: {
        truncate: function(text: string, displayFull: boolean){
            return displayFull ? text : text.substr(0, 400);
        }
    }
})
export default class Profile extends Vue {
    performer: Performer | null =  null;
    perfphotos: PerformerAvatar[] = [];

    fullSliderVisible: boolean = false;
    displayPic: number = 0;
    displayFullDescription: boolean = false;
    displaySlider: boolean = false;
    displayHeight: boolean = false;

    private serviceSocketId: number;
    private statusSocketId: number;

    get authenticated(): boolean {
        return this.$store.getters.isLoggedIn;
    }

    get activeState(): string {
        return this.$store.state.session.activeState;
    }

    get canPeek(): boolean{
        if (!this.performer){
            return false;
        }

        return this.performer.performer_services['peek'] && this.performer.performerStatus === 'BUSY';
    }

    get canCall(): boolean{
        if (!this.performer){
            return false;
        }

        if ([PerformerStatus.Busy, PerformerStatus.OnCall].indexOf(this.performer.performerStatus) > -1){
            return false;
        }

        return this.performer.performer_services['phone']
    }

    get performerPhotos(){
        if(this.performer && this.performer.photos && this.performer.photos.approved){
            return this.performer.photos.approved.photos.filter((photo: PerformerAvatar) => {
                return !this.$store.state.safeMode || photo.safe_version;
            });
        }

        return [];
    }

    openModal = openModal;
    getAvatarImage = getAvatarImage;
    getPerformerLabel = getPerformerLabel;

    addFavourite = (performer: Performer) => addFavourite(this.$store.state.authentication.user.id, performer.id).then(() => performer.isFavourite = true);
    removeFavourite = (performer: Performer) => removeFavourite(this.$store.state.authentication.user.id, performer.id).then(() => performer.isFavourite = false);

    mounted(){
        this.loadPerformer(parseInt(this.$route.params.id));

        this.serviceSocketId = notificationSocket.subscribe('service', (data: SocketServiceEventArgs) => {
            if(!this.performer || data.performerId !== this.performer.id){
                return;
            }

            if(data.serviceName === 'voyeur'){
                this.performer.isVoyeur = data.serviceStatus;
            } else {
                this.performer.performer_services[data.serviceName] = data.serviceStatus;
            }
        });

        this.statusSocketId = notificationSocket.subscribe('status', (data: SocketStatusEventArgs) => {
            if(!this.performer || data.performerId !== this.performer.id){
                return;
            }

            this.performer.performerStatus = data.status as PerformerStatus;
        });

        this.minHeight();

    }

    beforeDestroy(){
        notificationSocket.unsubscribe(this.serviceSocketId);
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.loadPerformer(parseInt(to.params.id));
    }

    @Watch('activeState') async onSessionStateChange(value: State, oldValue: State){
        if (value == State.Accepted){
            await this.$store.dispatch('initiate');
            if (!this.performer){
                return;
            }

            this.$router.push({
                name: this.$store.state.session.activeSessionType === SessionType.Peek ? 'Peek' : 'Videochat',
                params: {
                    id: this.performer.advertId.toString()
                }
            });
        }
    }

    openFullSlider(id: number){
        this.fullSliderVisible = true;
        this.displayPic = id;
    }

    hasService(service: string){
        return !this.performer ? false : this.performer.performer_services[service];
    }

    minHeight(){
        if(window.outerHeight > 1100){
            this.displayHeight = true;
            this.displaySlider = false;
        } else {
            this.displayHeight = false;
            this.displaySlider = true;
        }
    }

    toggleSlider(){
        this.displaySlider = !this.displaySlider;
    }

    async startVoyeur(payload: { ivrCode?: string }){
        if(!this.performer){
            return;
        }

        try {
            await this.$store.dispatch('voyeur/startVoyeur', { performerId: this.performer.id, ivrCode: payload.ivrCode });

            this.$router.push({
                name: 'Voyeur',
                params: {
                    id: this.performer.advertId.toString()
                }
            });
        } catch(ex){
            console.log(ex);
        }
    }

    async startSession(payload = {}){
        if(!this.performer){
            return;
        }

        const self = this;

        const defaults: RequestPayload = {
            type: 'startRequest',
            performer: <any>this.performer,
            sessionType: SessionType.Video,
            payment: PaymentType.Ivr
        };

        const toSend = {...defaults, ...payload};

        await this.$store.dispatch<RequestPayload>( toSend );
    }

    cancel(){
        this.$store.dispatch('cancel');
    }

    async startCall(){
        if(!this.performer){
            return;
        }

        const { result, error } = await createReservation(this.performer.advertId);

        if(error){
            this.$store.dispatch('errorMessage', 'profile.errorReservationFailed');
            return;
        }

        if(result.DNIS){
            window.open(`tel:${result.DNIS}`, '_self');
        }
    }

    async loadPerformer(id: number){
        const { result, error } = await getByAdvert(id);

        this.performer = result;

        this.setSeoParameters();
    }

    breastSize(cupSize:string):string{
        const knownSizes = ['xsmall', 'small', 'medium', 'large', 'xlarge'];
        if (knownSizes.indexOf(cupSize) == -1){
            return cupSize;

        }

        return this.$t(`profile.breastsizes.${cupSize}`).toString();
    }

    eyeColor(color:string):string{
        if(color === 'red&violet'){ color = 'redviolet' }
        const knownColors = ['brown','hazel','blue','green','silver','amber','grey','redviolet'];
        if (knownColors.indexOf(color) == -1){
            return color;
        }

        return this.$t(`profile.eyecolors.${color}`).toString();
    }

    setSeoParameters(){
        if(!this.performer){
            return;
        }

        setTitle(this.$t('profile.metaTitle', { nickname: this.performer.nickname }).toString());
        setDescription(this.$t('profile.metaDescription', { nickname: this.performer.nickname }).toString());
        setKeywords(`${this.performer.nickname}, ${this.performer.eyeColor}, ${this.performer.cupSize}`);

        setGraphData('og:type', 'profile');
        setGraphData('og:image', getAvatarImage(this.performer, 'medium'));
        setGraphData('profile:username', this.performer.nickname);
        setGraphData('profile:gender', 'female');
    }
}