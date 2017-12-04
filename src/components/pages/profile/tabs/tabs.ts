import { Component, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import './tabs.scss';

@Component({
    template: require('./tabs.tpl.html'),
    components: {
        videoChat: { template: require('./videochat.tpl.html') },
        videoCall: { template: require('./videocall.tpl.html') },
        call: { template: require('./call.tpl.html') },
        mail: { template: require('./mail.tpl.html') },
        sms: { template: require('./sms.tpl.html') }
    }
})
export default class Tabs extends Vue {

    selectedTab: string = 'videoChat';

    ivrCode: string = '';
    displayName: string = '';

    get user(){
        return this.$store.state.authentication.user;
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

    selectTab(newTab: string){
        this.selectedTab = newTab;
    }

    startSession(ivrCode: string, displayName: string){
        this.$emit('startSession', {
            ivrCode: ivrCode,
            displayName: displayName
        });
    }
}