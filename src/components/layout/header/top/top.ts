import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import config, { logo } from '../../../../config';
import { getPaymentInfo } from 'sensejs/consumer/payment';

import { openRoute, goBanner } from '../../../../util';

import './top.scss';

interface Campaign {
    number: number;
    cpm: number;
}
import WithRender from './top.tpl.html';

@WithRender
@Component
export default class Top extends Vue {

    campaign: Campaign = {number: 0, cpm: 0};
    fees: any[] = [];

    openRoute = openRoute;
    logo = logo;
    goBanner = goBanner;

    get info(){
        return this.$store.state.info;
    }

    get activeCampaign(){
        return this.$store.getters.getCampaignData;
    }

    get branding(){
        return this.$store.getters.getBranding;
    }

    get authenticated(){
        return this.$store.getters.isLoggedIn;
    }

    countNumbers(obj: any){
        return Object.keys(obj).length;
    }

    mounted(){
        this.getFees();
    }

    async getFees(){
        const { result, error } = await getPaymentInfo();

        if(error){
            return;
        }

        const data = result;
        this.fees = data.fees.slice().reverse();
    }

    goPayment(){
        const goto = this.authenticated ? this.openRoute('Payment') : '';
    }

}