import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { getAvatarImage } from '../../../util';

import config from '../../../config';

import './thankyou.scss';
import { Performer, PerformerStatus } from '../../../models/Performer';
import WithRender from './thankyou.tpl.html';

@WithRender
@Component
export default class Thankyou extends Vue {

    getAvatarImage = getAvatarImage;
    favorites: Performer[] = [];

    mounted(){
        this.loadFavorites();

        //Clear stored payment page data since the customers has now succesfully completed the transaction
        window.localStorage.removeItem(`${config.StorageKey}.payment-cache`);
    }

    async loadFavorites(){
        const userId = this.$store.state.authentication.user.id;

        const performerResults = await fetch(`${config.BaseUrl}/client/client_accounts/${this.$store.state.authentication.user.id}/favorite_performers?limit=100&offset=0`, {
            credentials: 'include'
        });

        const data = await performerResults.json();

        this.favorites = data.performerAccounts.filter((performer: Performer) => performer.performerStatus === PerformerStatus.Available);
    }
}