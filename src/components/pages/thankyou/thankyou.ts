import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { getAvatarImage } from '../../../utils/main.util';

import config from '../../../config';

import './thankyou.scss';
import WithRender from './thankyou.tpl.html';
import { listFavourites } from 'sensejs/performer/favourite';
import { Performer, PerformerStatus } from 'sensejs/performer/performer.model';

@WithRender
@Component
export default class Thankyou extends Vue {
    favorites: Performer[] = [];

    getAvatarImage = getAvatarImage;

    get user(){
        return this.$store.state.authentication.user;
    }

    mounted(){
        this.loadFavorites();

        //Clear stored payment page data since the customers has now succesfully completed the transaction
        window.localStorage.removeItem(`${config.StorageKey}.payment-cache-${this.user.id}`);
    }

    async loadFavorites(){
        const userId = this.$store.state.authentication.user.id;

        const { result } = await listFavourites(userId, {
            limit: 100,
            offset: 0
        });

        this.favorites = result.performerAccounts.filter((performer: Performer) => performer.performerStatus === PerformerStatus.Available);
    }
}