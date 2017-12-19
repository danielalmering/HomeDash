import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../../config';

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

    get logo(){
        return this.$store.getters.getLogoLight;
    }

    get info(){
        return this.$store.state.info;
    }

    get activeCampaign(){
        return this.$store.getters.getCampaignData;
    }

    get branding(){
        return this.$store.getters.getBranding;
    }

    mounted(){
        this.getFees();
    }

    routeGo(routename: string){
        this.$router.push({ name: routename });
    }

    async getFees(){
        const infoResults = await fetch(`${config.BaseUrl}/client/client_accounts/updatebalanceinfo`, {
            credentials: 'include'
        });

        const data = await infoResults.json();
        this.fees = data.fees.slice().reverse();
    }

}