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
        sms: { template: require('./sms.tpl.html') },
        voyeur: { template: require('./voyeur.tpl.html') },
        none: { template: require('./none.tpl.html') }
    }
})
export default class Tabs extends Vue {

    emailForm: EmailForm = { subject: '', content: '' };
    selectedTab: string = 'cam';

    ivrCode: string = '';

    @Prop() performer: Performer;

    mounted(){
        this.selectedTab = this.firstAvailable;
    }

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

        const allowedInSession = ['email', 'sms'];

        //If the performer is in a session you may only use certain services
        if(this.performer.performerStatus === PerformerStatus.Busy){
            return service === 'cam' && this.performer.performer_services['peek'] ? true : allowedInSession.indexOf(service) !== -1;
        }

        if (this.performer.performer_services[service]){
            return true;
        }

        return false;
    }

    get firstAvailable(){
        if(!this.performer){
            return 'none';
        }

        const ignoredServices = ['peek', 'voicemail', 'callconfirm', 'chat'];

        for (const service in this.performer.performer_services){
            if(this.enabled(service) && ignoredServices.indexOf(service) === -1){
                return service;
            }
        }

        return 'none';
    }

    get camLabel(): string {
        if (!this.performer){
            return 'tabs.service-webcam';
        }

        if (this.performer.performer_services['peek'] && this.performer.performerStatus === 'BUSY'){
            return 'tabs.service-peek';
        }

        return 'tabs.service-webcam';
    }

    get canPeek():boolean{
        if (!this.performer){
            return false;
        }

        return this.performer.performer_services['peek'] && this.performer.performerStatus === 'BUSY';
    }

    get authenticated(){
        return this.$store.getters.isLoggedIn;
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
        if(!this.user){
            return "";
        }

        if (this.authenticated){
            return this.user.displayName || this.user.username;
        } else {
            return this.user.displayName || '';
        }
    }

    set displayName(value:string){
        if (!this.user){
            return;
        }
        this.user.displayName = value;
    }

    @Watch('performer', { deep: true })
    onPerformerUpdate(newPerformer: Performer, oldPerformer: Performer){
        // const statusChanged = newPerformer.performerStatus !== oldPerformer.performerStatus;
        // const peekChanged = newPerformer.performer_services['peek'] !== oldPerformer.performer_services['peek'];

        // if((statusChanged || peekChanged) && this.selectedTab === 'cam'){
        //     this.selectedTab = this.firstAvailable;
        // }

        if(!newPerformer.performer_services[this.selectedTab]){
            this.selectedTab = this.firstAvailable;
        }
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

    startSession(description:{ivrCode?:string, displayName?:string, sessionType:string}){
        this.$emit('startSession', description);
    }

    startVoyeur(){
        this.$emit('startVoyeur');
    }

    async sendMail(){

        const message = {
            clientid: { id: this.user.id },
            content: this.emailForm.content,
            sent_by: 'CLIENT',
            status: 'INBOX',
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

            this.emailForm = {content: '', subject: ''};
        }
    }
}