import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import { Performer, Avatar } from '../../../models/Performer';
import { getAvatarImage } from '../../../util';
import PhotoSlider from './photo-slider';

import './profile.scss';

@Component({
    template: require('./profile.tpl.html'),
    components: {
        photoSlider: PhotoSlider
    }
})
export default class Profile extends Vue {
    performer: Performer | boolean = false;
    perfphotos : Avatar[] = [];

    getAvatarImage = getAvatarImage;

    mounted(){
        this.loadPerformer(parseInt(this.$route.params.id));
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.loadPerformer(parseInt(to.params.id));
    }

    async loadPerformer(id: number){
        const performerResults = await fetch(`https://www.thuis.nl/api/performer/performer_accounts/performer_number/${id}?limit=10`);

        const data = await performerResults.json();

        this.performer = data.performerAccount;

        if(this.$store.state.safeMode){
            this.perfphotos = data.photos.approved.photos.filter((photo: Avatar) => photo.safe_version);
        } else {
            this.perfphotos = data.photos.approved.photos;
        }
    }
}