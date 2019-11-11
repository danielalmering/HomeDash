import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import { openModal, getAvatarImage, getPerformerLabel, hasService  } from '../../../util';
import { RequestPayload, SessionState } from '../../../store/session/';
import { SessionType, State, PaymentType } from '../../../models/Sessions';

import Slider from './slider/slider';
import FullSlider from './slider/slider-fullscreen.vue';
import Tabs from './tabs/tabs';
import config from '../../../config';

import notificationSocket from '../../../socket';
import { SocketServiceEventArgs, SocketStatusEventArgs, SocketVoyeurEventArgs } from '../../../models/Socket';
import Confirmation from '../../layout/Confirmations.vue';
import { setTitle, setDescription, setKeywords, setGraphData } from '../../../seo';
import { tabEnabled } from '../../../performer-util';

import { getByAdvert } from 'sensejs/performer';

import './profile.scss';
import WithRender from './profile.tpl.html';
import { Performer, PerformerStatus, PerformerAvatar } from 'sensejs/performer/performer.model';
import { createReservation } from 'sensejs/session';
import { removeFavourite, addFavourite } from 'sensejs/performer/favourite';
import { removeSubscriptions, addSubscriptions } from 'sensejs/performer/subscriptions';
const swfobject = require('swfobject');

@WithRender
@Component({
    components: {
        slider: Slider,
        sliderFull: FullSlider,
        tabs: Tabs,
        confirmation: Confirmation
    },
    filters: {
        truncate: function(text: string, displayFull: boolean){
            const textshort = (text.length != 0) ? text.substr(0, 400) : ''; 
            return displayFull ? text : textshort;
        }
    }
})
export default class Profile extends Vue {
    performer: Performer | null =  null;
    perfmedia: PerformerAvatar[];
    country = config.Country;

    fullSliderVisible: boolean = false;
    displayPic: number = 0;
    displayFullDescription: boolean = false;
    displaySlider: boolean = true;

    private serviceSocketId: number;
    private statusSocketId: number;
    private voyeurSocketId: number;

    private tabEnabled = tabEnabled;

    get safeMode(){
        return this.$store.getters.getSafeMode;
    }

    get authenticated(): boolean {
        return this.$store.getters.isLoggedIn;
    }

    get user(){
        return this.$store.state.authentication.user;
    }

    get activeState(): string {
        return this.$store.state.session.activeState;
    }

    get canPeek(): boolean{
        if (!this.performer){
            return false;
        }

        return hasService(this.performer, 'peek') && this.performer.performerStatus === 'BUSY';
    }

    get canCall(): boolean{
        if (!this.performer){
            return false;
        }

        if ([PerformerStatus.Busy, PerformerStatus.OnCall, PerformerStatus.Request].indexOf(this.performer.performerStatus) > -1){
            return false;
        }

        return hasService(this.performer, 'phone');
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
    addSubscriptions = (performer: Performer) => addSubscriptions(this.$store.state.authentication.user.id, performer.id).then(() => {
        performer.isSubscribed = true
        if(!this.user.notification_mode){
            const loggedin = !this.authenticated ? this.openModal('login') : this.openModal('notifications', 'SSA');
        }
    });
    removeSubscriptions = (performer: Performer) => removeSubscriptions(this.$store.state.authentication.user.id, performer.id).then(() => performer.isSubscribed = false);

    mounted(){
        this.loadPerformer(parseInt(this.$route.params.id));

        // Update performer services
        this.serviceSocketId = notificationSocket.subscribe('service', (data: SocketServiceEventArgs) => {
            if(!this.performer || data.performerId !== this.performer.id){
                return;
            }

            if(data.services && data.services['voyeur']){
                this.performer.isVoyeur = data.services['voyeur'];
            } else if(data.serviceName === 'voyeur'){
                this.performer.isVoyeur = data.serviceStatus;
            }

            if(data.services){
                this.performer.performer_services = { ...this.performer.performer_services, ...data.services };
            }

            if(data.status){
                this.performer.performerStatus = data.status;
            }

            if(data.serviceName){
                this.performer.performer_services[data.serviceName] = data.serviceStatus;
            }
        });

        const onSocketStatus = (data: SocketStatusEventArgs) => {
            if(!this.performer){
                setTimeout(() => onSocketStatus(data), 100);
                return;
            }

            if(data.performerId !== this.performer.id){
                return;
            }

            this.performer.performerStatus = data.status as PerformerStatus;
        };

        // Update performer status
        this.statusSocketId = notificationSocket.subscribe('status', onSocketStatus);

        // Update voyeur status
        this.voyeurSocketId = notificationSocket.subscribe('voyeur', (data: SocketVoyeurEventArgs) => {
            if(this.performer && this.performer.id === data.performerId && data.type === 'STREAMING'){
                this.performer.isVoyeur = data.value;
            }
        });

        this.minHeight();
    }

    beforeDestroy(){
        notificationSocket.unsubscribe(this.serviceSocketId);
        notificationSocket.unsubscribe(this.statusSocketId);
        notificationSocket.unsubscribe(this.voyeurSocketId);
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

    minHeight(){
        if(window.outerHeight > 1070){
            this.displaySlider = true;
        } else {
            this.displaySlider = false;
        }
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

    async startSession(payload:any = {}){
        if(!this.performer){
            return;
        }

        //Uncomment if you need to offer the user the possibility to use flash
        //if you need the user to hear the performer
        // if (payload.sessionType != 'PEEK' && !hasWebAudio()){
        //     this.enableFlash = ! (await this.checkFlash());
        //     if (this.enableFlash){
        //         return;
        //     }
        // }

        const defaults: RequestPayload = {
            type: 'startRequest',
            performer: <any>this.performer,
            sessionType: SessionType.Video,
            payment: PaymentType.Ivr
        };

        const toSend = {...defaults, ...payload};

        if(!notificationSocket.isConnected()){
          
            notificationSocket.connect();

            const event = notificationSocket.subscribe('authenticated', () => {
                this.$store.dispatch<RequestPayload>( toSend );

                notificationSocket.unsubscribe(event);
            });
        } else {
            this.$store.dispatch<RequestPayload>( toSend );
        }
    }


    enableFlash:boolean = false;

    unNagFlash(){
        this.enableFlash = false;
    }

    async checkFlash():Promise<boolean>{
        return new Promise<boolean>( (resolve, reject)=> {
            let timeout = window.setTimeout( ()=> {
                timeout = Number.NaN;
                resolve(false);
            }, 1000);

            window.flashCheckCallback = ()=> {
                if (isNaN(timeout)){
                    return;
                }
                window.clearTimeout(timeout);
                resolve(true);
            };

            swfobject.embedSWF(
                '/static/checkflash.swf', 'profile__flash-check', '100%', '100%', '10.2.0', true, {}, {wmode:'transparent'}
            );
        });
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

        if(error){
            this.$router.push({ name: 'Performers' });

            throw new Error(`Api error: ${error}`);
        }

        this.performer = result;

        if(!result.photos) { return; }
        if(!result.photos.approved) { return; }
        if(this.safeMode){
            this.perfmedia = [];
            for (let photo of result.photos.approved.photos) {
                const pushfoto = photo.safe_version ? this.perfmedia.push(photo) : '';
            }
        } else {
            this.perfmedia = result.photos.approved.photos;
        }

        // Add videos
        if(!result.medias) { return; }
        if(!result.medias.approved) { return; }

        if(result.medias.approved.total > 0 && !this.safeMode){
            let s = 0;
            let i = 0;
            for (let media of result.medias.approved.medias) {
                if (s <= result.photos.approved.total) {                    
                    this.perfmedia.splice(s, 0, result.medias.approved.medias[i]);    
                    s = s + 4;
                    i++;                                            
                }                
            }
        }

        this.setSeoParameters(this.performer);
    }

    openTab(event: Event){
        if(!event){ return }
        const target = event.target as HTMLElement;
        if(!target.parentElement){ return }
        const parent = target.parentElement.lastChild as HTMLElement;
        if(!parent){ return }

        if(target.classList.contains('active')){
            target.classList.remove('active')
            parent.style.display = "none";
        } else {
            target.classList.add('active')
            parent.style.display = "block";
        }
    }

    breastSize(cupSize:string):string{
        const knownSizes = ['xsmall', 'small', 'medium', 'large', 'xlarge'];
        if (knownSizes.indexOf(cupSize) == -1){
            return cupSize;

        }

        return this.$t(`profile.breastsizes.${cupSize}`).toString();
    }

    eyeColor(color:string):string{
        if (color === 'red&violet'){ color = 'redviolet'; }
        const knownColors = ['brown','hazel','blue','green','silver','amber','grey','redviolet'];
        if (knownColors.indexOf(color) == -1){
            return color;
        }

        return this.$t(`profile.eyecolors.${color}`).toString();
    }

    setSeoParameters(performer: Performer){
        if(!performer){
            return;
        }

        setTitle(this.$t('profile.metaTitle', { nickname: performer.nickname }).toString());
        setDescription(this.$t('profile.metaDescription', { nickname: performer.nickname }).toString());
        setKeywords(`${performer.nickname}, ${performer.eyeColor}, ${performer.cupSize}`);

        setGraphData('og:type', 'profile');
        setGraphData('og:image', getAvatarImage(performer, 'medium'));
        setGraphData('profile:username', performer.nickname);
        setGraphData('profile:gender', 'female');
    }
}
