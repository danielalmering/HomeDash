import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { getAvatarImage } from '../../../util';

import config from '../../../config';

import './thankyou.scss';

@Component({
    template: require('./thankyou.tpl.html')
})
export default class Thankyou extends Vue {

    getAvatarImage = getAvatarImage;
    favos: any[] = [];

    mounted(){
        this.loadFavorites();
    }

    async loadFavorites(){
        const userId = this.$store.state.authentication.user.id;

        const performerResults = await fetch(`${config.BaseUrl}/client/client_accounts/${this.$store.state.authentication.user.id}/favorite_performers?limit=20&offset=0`, {
            credentials: 'include'
        });
        const data = await performerResults.json();
        
        this.favos = data.performerAccounts.filter((performer: any) => performer.performerStatus === 'AVAILABLE');
    }

}