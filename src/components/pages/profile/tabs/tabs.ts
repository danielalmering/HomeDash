import { Component, Watch, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../models/User';

import config from '../../../../config';

interface EmailForm {
    subject: string;
    content: string;
}

import './tabs.scss';
import { Performer, PerformerStatus } from '../../../../models/Performer';

@Component({
    template: require('./tabs.tpl.html'),
    components: {
        cam: { template: require('./cam.tpl.html') },
        videocall: { template: require('./videocall.tpl.html') },
        phone: { template: require('./phone.tpl.html') },
        email: { template: require('./email.tpl.html') },
        sms: { template: require('./sms.tpl.html') }
    }
})
export default class Tabs extends Vue {

    emailForm: EmailForm = { subject: "", content: "" };
    selectedTab: string = 'cam';

    ivrCode: string = '';

    @Prop() performer: Performer;

    enabled(service: string): boolean{
        if (!this.performer){
            return false;
        }

        //services:
        //cam,email,peek,phone,sms,videocall,voicemail
        //voyeur is an exception..
        if (service === 'voyeur'){
            return this.performer.isVoyeur;
        }

        if (!(service in this.performer.performer_services) ){
            throw new Error(`${service} ain't no service I ever heard of!`);
        }

        if (this.performer.performer_services[service]){
            return true;
        }

        if (service === 'cam'){
            return this.performer.performerStatus === PerformerStatus.Busy &&
            this.performer.performer_services['peek'];
        }

        return false;
    }

    get camLabel(): string {
        if (!this.performer){
            return 'tabs.service-webcam';
        }

        if (this.performer.performer_services['cam']){
            return 'tabs.service-webcam';
        }

        if (this.performer.performer_services['peek']){
            return 'tabs.service-peek';
        }

        return 'tabs.service-peek';
    }

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

    get displayName(): string {
        return 'Karel';
    }

    selectTab(newTab: string){
        console.log(`${newTab} enabled: ${this.enabled(newTab)}`);
        if (this.enabled(newTab)){
            this.selectedTab = newTab;
        }
    }

    login(){
        this.$store.dispatch('displayModal', 'login');  
    }

    startSession(ivrCode: string, displayName: string, service: string){
        this.$emit('startSession', { ivrCode, displayName, service });
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