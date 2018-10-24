import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../config';
import WithRender from './promos.tpl.html';
import { getPromos } from 'sensejs/consumer/category';
import { Promo as PromoData } from 'sensejs/core/models/category';
import { User } from '../../../models/User';
import { goBanner, openModal } from '../../../util';

@WithRender
@Component
export default class Promo extends Vue {

    promos: PromoData[] = [];
    addPromoNotifi = (user: User) => this.$store.dispatch('updateUser', {user: this.$store.state.authentication.user, notify: 'PRO'});

    get notify(){
        return (type: string) => {
            return this.$store.state.authentication.user.notification_types[type];
        }
    }
    
    goBanner = goBanner;
    openModal = openModal;

    get authenticated(){
        return this.$store.getters.isLoggedIn;
    }

    mounted(){
        this.loadPromos();
    }

    async loadPromos(){
        const { result, error } = await getPromos();

        if(error){
            this.$store.dispatch('openMessage', {
                content: 'promos.alerts.errorLoad',
                class: 'error'
            });

            return;
        }

        //Position 1 means that it's actually a promo in the CMS
        if(!result.length){
            return;
        }

        this.promos = result.filter(promo => promo.position === 1);
    }
}