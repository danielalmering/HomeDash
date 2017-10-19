import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './profile.scss';

interface Performer {
    id: number;
    name: string;
    performer_services: { [key: string]: boolean }
};

@Component({
    template: require('./profile.tpl.html'),
})
export default class Profile extends Vue {

    performer: Performer[] = [];
    perfphotos : any[] = [];


    mounted(){
        this.loadPerformer();

        console.log(this.$route);
    }

    async loadPerformer(){
        const performerResults = await fetch(`https://www.thuis.nl/api/performer/performer_accounts/performer_number/${this.$route.params.id}?limit=10`);

        const data = await performerResults.json();
        this.performer = data.performerAccount;
        this.perfphotos = data.photos.approved.photos;

    }
}