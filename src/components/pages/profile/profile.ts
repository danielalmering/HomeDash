import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import { Performer, Avatar } from '../../../models/Performer';
import { getAvatarImage } from '../../../util';
import { RequestPayload } from '../../../store/session';
import { SessionType, State } from '../../../models/Sessions';

import PhotoSlider from './photo-slider.vue';
import FullSlider from './photo-slider-fullscreen.vue';
import Tabs from './tabs/tabs';
import config from '../../../config';

import notificationSocket from '../../../socket';
import { SocketServiceEventArgs } from '../../../models/Socket';

import './profile.scss';
import './photo-slider.scss';

@Component({
    template: require('./profile.tpl.html'),
    components: {
        photoSlider: PhotoSlider,
        photoSliderFull: FullSlider,
        tabs: Tabs
    },
    filters: {
        truncate: function(text: string, displayFull: boolean){
            return displayFull ? text : text.substr(0, 400);
        }
    }
})
export default class Profile extends Vue {
    performer: Performer | null =  null;
    perfphotos : Avatar[] = [];

    fullSliderVisible: boolean = false;
    displayPic: number = 0;
    displayFullDescription: boolean = false;

    private serviceSocketId: number;

    get authenticated(): boolean {
        return this.$store.getters.isLoggedIn;
    }

    getAvatarImage = getAvatarImage;

    addFavourite = (performer: Performer) => this.$store.dispatch('addFavourite', performer.id).then(() => performer.isFavourite = true);
    removeFavourite = (performer: Performer) => this.$store.dispatch('removeFavourite', performer.id).then(() => performer.isFavourite = false);

    mounted(){
        this.loadPerformer(parseInt(this.$route.params.id));

        this.serviceSocketId = notificationSocket.subscribe('service', (data: SocketServiceEventArgs) => {
            if(!this.performer){
                return;
            }

            if(data.serviceName === 'voyeur'){
                this.performer.isVoyeur = data.serviceStatus;
            } else {
                this.performer.performer_services[data.serviceName] = data.serviceStatus;
            }
        });
    }

    beforeDestroy(){
        notificationSocket.unsubscribe(this.serviceSocketId);
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.loadPerformer(parseInt(to.params.id));
    }

    openFullSlider(id: number){
        this.fullSliderVisible = true;
        this.displayPic = id;
    }

    async startVoyeur({}){
        if(!this.performer){
            return;
        }

        try {
            await this.$store.dispatch('voyeur/startVoyeur', { performerId: this.performer.id });

            this.$router.push({
                name: 'Voyeur',
                params: {
                    id: this.performer.advert_numbers[0].advertNumber.toString()
                }
            })
        } catch(ex){
            console.log(ex);
        }
    }

    async startSession(payload={}){
        if(!this.performer){
            return;
        }

        const self = this;

        let defaults:RequestPayload = {
            type: 'startRequest',
            performer: this.performer,
            sessionType: SessionType.Video
        };

        const toSend = {...defaults,...payload};

        await this.$store.dispatch<RequestPayload>( toSend ); 

        this.$store.watch((state) => state.session.activeState, async (newValue: State) => {
            if(newValue === State.Canceling || newValue === State.Ending){
                //Kill session loader
            }

            if(newValue === State.Accepted){
                await this.$store.dispatch('initiate');

                //Remove this when I find a way to not have double types
                if(!self.performer){
                    return;
                }

                this.$router.push({
                    name: 'Videochat',
                    params: {
                        id: self.performer.advert_numbers[0].advertNumber.toString()
                    }
                });
            }
        });
    }

    async loadPerformer(id: number){
        const performerResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/performer_number/${id}?limit=10`, {
            credentials: 'include'
        });

        const data = await performerResults.json();

        this.performer = data.performerAccount;
        this.perfphotos = data.photos.approved.photos;

        if(this.$store.state.safeMode){
            this.perfphotos = this.perfphotos.filter((photo: Avatar) => photo.safe_version);
        }
    }
}