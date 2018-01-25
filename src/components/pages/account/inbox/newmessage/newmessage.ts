import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { UserRole, User } from '../../../../../models/User';

import store from '../../../../../store';
import config from '../../../../../config';
import WithRender from './newmessage.tpl.html';
import notificationSocket from '../../../../../socket';
import { tagHotjar } from '../../../../../util';

interface MessageForm {
    subject: string;
    content: string;
}

interface BarePerformer {
    id: number;
    username: string;
    adv:string;
    img:string;
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
            const performer = this.performers.find( p => p.id == this.selectedPerformer );

            if (!performer) return;

            this.performerSearchQuery = `${performer.username} (${performer.adv})`;
        }
    }

    selectPerformer(performer:BarePerformer){
        this.selectedPerformer = performer.id;
        this.performerSearchQuery = `${performer.username} (${performer.adv})`;
    }

    getImage(performer: BarePerformer){
        if(!store.state.safeMode && performer.img){
            return `${config.ImageUrl}pimg/${performer.id}/small/${performer.img}`;
        }

        if(store.state.safeMode && performer.img){
            return;
        }

        return require('../../../../../assets/images/placeholder.png');
    }

    get performersFilter(){
        if(this.performerSearchQuery === ''){
            return [];
        }

        const terms = this.performerSearchQuery.toLowerCase().trim().split(' ');

        return this.performers.filter(performer => {
            const search = `${performer.username.toLowerCase()} (${performer.adv})`;

            for(const term of terms){
                if (search.indexOf(term) === -1){
                    return false;
                }
            }

            return true;
        }).slice(0, 10);
    }

    async loadPerformers() {
        const performersResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/usernames?extra=1&service=email`, {
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
            tagHotjar('MESSAGE_SEND');

            notificationSocket.sendEvent({
                event: 'message',
                receiverType: UserRole.Performer,
                receiverId: this.selectedPerformer,
                content: {
                    clientId : user.id,
                    performerId : this.selectedPerformer,
                    sentBy : 'CLIENT',
                    type : 'EMAIL'
                }
            });

            this.$store.dispatch('successMessage', 'account.alerts.successNewMessage');
            this.message = { subject: '', content: '' };
        }

        this.performerSearchQuery = '';
    }

}