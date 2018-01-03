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
import { openModal } from '../../../../util';

import WithRender from './tabs.tpl.html';

@WithRender
@Component({
    components: {
        cam: { render: require('./cam.tpl.html')({}).render },
        videocall: { render: require('./videocall.tpl.html')({}).render },
        phone: { render: require('./phone.tpl.html')({}).render },
        email: { render: require('./email.tpl.html')({}).render },
        sms: { render: require('./sms.tpl.html')({}).render },
        voyeur: { render: require('./voyeur.tpl.html')({}).render },
        none: { render: require('./none.tpl.html')({}).render },
    }
})
export default class Tabs extends Vue {

    emailForm: EmailForm = { subject: '', content: '' };
    selectedTab: string = 'cam';
    openModal = openModal;

    ivrCode: string = '';

    tabs = {
        'cam': 'video-camera',
        'videocall': 'video-camera',
        'voyeur': 'eye',
        'phone': 'phone',
        'email': 'envelope',
        'sms': 'mobile'
    };

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
        if (this.performer && this.performer.performer_services['peek'] && this.performer.performerStatus === 'BUSY'){
            return 'peek';
        }

        return 'cam';
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
            return this._displayName;
        }

        if (this.authenticated){
            return this.user.displayName || this.user.username;
        } else {
            return this.user.displayName || '';
        }
    }

    set displayName(value:string){
        if (!this.user){
            this._displayName = value;
        } else {
            this.user.displayName = value;
        }
    }

    private _displayName:string = "";

    @Watch('performer', { deep: true })
    onPerformerUpdate(newPerformer: Performer, oldPerformer: Performer){
        if(!newPerformer.performer_services[this.selectedTab] || !this.enabled(this.selectedTab)){
            this.selectedTab = this.firstAvailable;
        }
    }

    selectTab(newTab: string){
        if (this.enabled(newTab)){
            this.selectedTab = newTab;
        }
    }

    startSession(description:{ivrCode?:string, displayName?:string, payment?:string,sessionType:string}){
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
                content: 'contact.alerts.errorSend',
                class: 'error'
            });
        } else {
            this.$store.dispatch('openMessage', {
                content: 'contact.alerts.successSend',
                class: 'success'
            });

            this.emailForm = {content: '', subject: ''};
        }
    }
}