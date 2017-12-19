import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../../models/User';

import config from '../../../../../config';
import WithRender from './newmessage.tpl.html';

interface MessageForm {
    subject: string;
    content: string;
}

interface BarePerformer {
    id: number;
    username: string;
}

@WithRender
@Component
export default class Newmessage extends Vue {

    message: MessageForm = { subject: '', content: '' };

    performers: BarePerformer[] = []; //This call returns performer id's, not adverts... include adverts lol
    performerSearchQuery: string = '';
    selectedPerformer: number = 0;

    async mounted(){
        await this.loadPerformers();

        if(this.$route.params.advertId){
            this.selectedPerformer = parseInt(this.$route.params.advertId);
            this.performerSearchQuery = this.selectedPerformerUsername;
        }
    }

    selectPerformer(performerId: number){
        this.selectedPerformer = performerId;
        this.performerSearchQuery = this.selectedPerformerUsername;
    }

    get selectedPerformerUsername(){
        const performer = this.performers.find(p => p.id === this.selectedPerformer);

        return performer ? performer.username : '';
    }

    get performersFilter(){
        if(this.performerSearchQuery === ''){
            return [];
        }

        return this.performers.filter((perf: BarePerformer) => {
            return perf.username.toLocaleLowerCase().indexOf(this.performerSearchQuery.toLowerCase()) > -1 ||
                    perf.id === parseInt(this.performerSearchQuery);
        });
    }

    async loadPerformers() {
        const performersResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/usernames`, {
            credentials: 'include'
        });

        this.performers =  await performersResults.json();
    }

    async sendMessage(){
        const user: User = this.$store.state.authentication.user;

        if(!this.message.content || this.selectedPerformer === 0 || !this.message.subject){
            this.$store.dispatch('errorMessage', 'account.alerts.errorNewMessage');
            return;
        }

        const message = {
            clientid: { id: user.id },
            content: this.message.content,
            performer_account: { id: this.selectedPerformer },
            sent_by: 'CLIENT',
            status: 'INBOX',
            subject: this.message.subject
        };

        const newmessageResult = await fetch(`${config.BaseUrl}/performer/performer_account/${this.selectedPerformer}/email`, {
            method: 'POST',
            body: JSON.stringify(message),
            credentials: 'include'
        });

        if(newmessageResult.ok){
            this.$store.dispatch('successMessage', 'account.alerts.successNewMessage');
            this.message = { subject: '', content: '' };
        }
    }


}