import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../config';
import WithRender from './promos.tpl.html';
import { getPromos } from 'SenseJS/consumer/Category';
import { Promo as PromoData } from 'SenseJS/core/models/category';

@WithRender
@Component
export default class Promo extends Vue {

    promos: PromoData[] = [];

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
        this.promos = result.filter(promo => promo.position === 1);
    }
}