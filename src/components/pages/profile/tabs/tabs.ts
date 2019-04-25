import { Component, Watch, Prop } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';
import { UserRole, User } from '../../../../models/User';
import { postNotificationThread } from 'sensejs/consumer/notification';

import config from '../../../../config';

interface EmailForm {
    subject: string;
    content: string;
}

import './tabs.scss';
import { Performer, PerformerStatus, PerformerAvatar } from 'sensejs/performer/performer.model';
import { openModal, tagHotjar } from '../../../../util';
import notificationSocket from '../../../../socket';

import WithRender from './tabs.tpl.html';
import { tabEnabled } from '../../../../performer-util';

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
    tabEnabled = tabEnabled;

    tabs = config.locale.Services;

    @Prop() performer: Performer | any;

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
            if(this.tabEnabled(service, this.performer, this.user) && ignoredServices.indexOf(service) === -1){
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
        const usr = {...this.user, displayName:value };
        this.$store.commit('setUser', {...this.user, displayName:value });
    }

    get advertNumber():string{
        if (!this.performer){
            return '0000';
        }
        if (!this.performer.advertId){
            return '0000';
        }

        return this.performer.advertId.toString();
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
        if(!newPerformer.performer_services[this.selectedTab] || !this.tabEnabled(this.selectedTab, this.performer, this.user)){
            this.selectedTab = this.firstAvailable;
        }
    }

    selectTab(newTab: string){
        if (this.tabEnabled(newTab, this.performer, this.user)){
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

        if(!this.emailForm.content && !this.emailForm.subject){
            return;
        }

        let message = {
            account_id: this.performer.id,
            content: this.emailForm.content,
            type: 'email',
            reply_id: 0,
            subject: this.emailForm.subject
        };

        const { result, error } = await postNotificationThread(message);

        if(error){
            this.$store.dispatch('openMessage', {
                content: 'contact.alerts.errorSend',
                class: 'error'
            });

            return;
        }

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