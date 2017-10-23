import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import { Performer, Avatar } from '../../../models/Performer';
import { getAvatarImage } from '../../../util';

import PhotoSlider from './photo-slider';
import FullSlider from './photo-slider-fullscreen';
import Tabs from './tabs/tabs';

import './profile.scss';
import './photo-slider.scss';

@Component({
    template: require('./profile.tpl.html'),
    components: {
        photoSlider: PhotoSlider,
        photoSliderFull: FullSlider,
        tabs: Tabs
    }
})
export default class Profile extends Vue {
    performer: Performer | boolean = false;
    perfphotos : Avatar[] = [];

    fullSliderVisible: boolean = false;
    displayPic: number = 0;

    getAvatarImage = getAvatarImage;

    addFavourite = (performer: Performer) => this.$store.dispatch('addFavourite', performer.id).then(() => performer.isFavourite = true);
    removeFavourite = (performer: Performer) => this.$store.dispatch('removeFavourite', performer.id).then(() => performer.isFavourite = false);

    mounted(){
        this.loadPerformer(parseInt(this.$route.params.id));
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.loadPerformer(parseInt(to.params.id));
    }

    openFullSlider(id: number){
        this.fullSliderVisible = true;
        this.displayPic = id;
    }

    async loadPerformer(id: number){
        const performerResults = await fetch(`https://www.thuis.nl/api/performer/performer_accounts/performer_number/${id}?limit=10`, {
            credentials: 'include'
        });

        const data = await performerResults.json();

        this.performer = data.performerAccount;

        if(this.$store.state.safeMode){
            this.perfphotos = data.photos.approved.photos.filter((photo: Avatar) => photo.safe_version);
        } else {
            this.perfphotos = data.photos.approved.photos;
        }
    }
}