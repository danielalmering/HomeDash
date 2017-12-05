import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './top.scss';

interface Campaign {
    number: number;
    cpm: number;
}

@Component({
    template: require('./top.tpl.html')
})
export default class Top extends Vue {

    campaign: Campaign = {number: 0, cpm: 0};

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

}