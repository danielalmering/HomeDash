import { Component, Watch } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../models/User';

import config from '../../../../config';

interface EmailForm {
    subject: string;
    content: string;
}

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
    emailForm: EmailForm = { subject: "", content: "" };

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
        
    async sendMail(){
        
        let message = {
            clientid: { id: this.user.id },
            content: this.emailForm.content,
            sent_by: "CLIENT",
            status: "INBOX",
            subject: this.emailForm.subject
        };

        const mailResult = await fetch(`${config.BaseUrl}/performer/performer_account/158/email`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(message)
        });

        const mailData = await mailResult.json();

        if(!mailResult.ok){
            this.$store.dispatch('openMessage', {
                content: 'contact.errorSend',
                class: 'error'
            });
        } else {
            this.$store.dispatch('openMessage', {
                content: 'contact.successSend',
                class: 'success'
            });

            this.emailForm = {content: "", subject: ""};
        }
    }
}