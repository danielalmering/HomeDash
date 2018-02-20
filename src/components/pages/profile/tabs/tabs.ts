import { Component, Watch, Prop } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';
import { UserRole, User } from '../../../../models/User';

import config from '../../../../config';

interface EmailForm {
    subject: string;
    content: string;
}

import './tabs.scss';
import { Performer, PerformerStatus } from '../../../../models/Performer';
import { openModal, tagHotjar, serviceEnabled } from '../../../../util';
import notificationSocket from '../../../../socket';

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
    serviceEnabled = serviceEnabled;

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

    get firstAvailable(){
        if(!this.performer){
            return 'none';
        }

        const ignoredServices = ['peek', 'voicemail', 'callconfirm', 'chat'];

        // Sidebar overwrites
        if(this.$route.params.category === 'teasers' && this.performer.isVoyeur){
            return 'voyeur';
        }

        if(this.$route.params.category === 'peek' && this.performer.performer_services['peek'] && this.performer.performerStatus === 'BUSY'){
            return 'cam';
        }

        if( ( [PerformerStatus.Busy, PerformerStatus.OnCall].indexOf(this.performer.performerStatus)>-1 ) && this.performer.isVoyeur){
            return 'voyeur';
        }

        for (const service in this.performer.performer_services){
            if(this.serviceEnabled(service, this.performer) && ignoredServices.indexOf(service) === -1){
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
        if (this.authenticated){
            return this.user.displayName || this.user.username;
        } else {
            return this.user.displayName || '';
        }
    }

    set displayName(value:string){
        var usr = {...this.user, displayName:value };
        this.$store.commit("setUser", {...this.user, displayName:value });
    }

    get advertNumber():string{
        if (!this.performer){
            return "0000";
        }
        if (!this.performer.advert_numbers.length){
            return "0000";
        }

        return this.performer.advert_numbers[0].advertNumber.toString();
    }

    get ivrCode():string{
        return this.$store.state.session.activeIvrCode;
    }

    set ivrCode(value:string){
        this.$store.commit('setIvrCode', value);
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.selectedTab = this.firstAvailable;
    }

    @Watch('performer', { deep: true })
    onPerformerUpdate(newPerformer: Performer, oldPerformer: Performer){
        if(!newPerformer.performer_services[this.selectedTab] || !this.serviceEnabled(this.selectedTab, this.performer)){
            this.selectedTab = this.firstAvailable;
        }
    }

    selectTab(newTab: string){
        if (this.serviceEnabled(newTab, this.performer)){
            this.selectedTab = newTab;
        }
    }

    startSession(description:{ivrCode?:string, displayName?:string, payment?:string,sessionType:string}){
        this.$emit('startSession', description);
    }

    startVoyeur(ivr: boolean = false){
        if(ivr && this.ivrCode === ''){
            this.$store.dispatch('errorMessage', 'tabs.errorNoIvrCode');
            return;
        }

        this.$emit('startVoyeur', { ivrCode: ivr ? this.ivrCode : undefined });
    }

    async sendMail(){

        const message = {
            clientid: { id: this.user.id },
            content: this.emailForm.content,
            sent_by: 'CLIENT',
            status: 'INBOX',
            subject: this.emailForm.subject
        };

        const mailResult = await fetch(`${config.BaseUrl}/performer/performer_account/${this.performer.id}/email`, {
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
            notificationSocket.sendEvent({
                event: 'message',
                receiverType: UserRole.Performer,
                receiverId: this.performer.id,
                content: {
                    clientId : this.user.id,
                    performerId : this.performer.id,
                    sentBy : 'CLIENT',
                    type : 'EMAIL'
                }
            });

            this.$store.dispatch('openMessage', {
                content: 'contact.alerts.successSend',
                class: 'success'
            });

            tagHotjar('MESSAGE_SEND_PROFILE');

            this.emailForm = {content: '', subject: ''};
        }
    }
}