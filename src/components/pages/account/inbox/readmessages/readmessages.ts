import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { getAvatarImage, getPerformerStatus } from '../../../../../util';
import { Route } from 'vue-router';
import { User } from '../../../../../models/User';

import config from '../../../../../config';
import WithRender from './readmessages.tpl.html';
import { tagHotjar } from '../../../../../util';
import { NotificationThreadsMessage } from 'sensejs/core/models/notification';
import { getNotificationThread, PostNotificationParams, postNotification, payNotification, removeNotificationThread } from 'sensejs/consumer/notification';

import './readmessages.scss';
@WithRender
@Component
export default class Readmessages extends Vue {

    messages: any = [];
    message: any;
    performer: any;
    client: any;
    subject: string = '';
    reply: string = '';
    total: number = 0;

    getPerformerStatus = getPerformerStatus;

    query = {
        limit: 20,
        offset: 0
    };

    async mounted(){
        await this.loadMessages();
        await this.$store.dispatch('getSession');
    }

    get creditsPerType(){
        return (type: string) => {
            return this.$store.state.info[`credits_per_${type.toLocaleLowerCase()}`];
        }
    }

    get getAvatar(){
        return (performer: any, sent_by: string) => {
            return (sent_by === 'PERFORMER') ? `${config.ImageUrl}pimg/${performer.id}/small/${performer.avatar.name}` : require('../../../../../assets/images/placeholder.png');
        }
    }

    get getName(){
        return (sent_by: string) => {
            return (sent_by === 'PERFORMER') ? this.performer.nickname : this.client.username;
        }
    }

    handleScroll(event: any){

        console.log(event);

        if(event === null){ return }

        if ((event.target.scrollTop + event.target.offsetHeight) >= event.target.scrollHeight) {
            this.loadMessages();
        }

        // if(window.scrollY < 1){
        //     this.query.offset = this.query.offset - 20;
        //     this.loadMessages();
        //     console.log(this.query.offset);
        // }

        // if(window.scrollY === window.pageYOffset){
        //     this.query.offset = this.query.offset + 20;
        //     this.loadMessages();
        //     console.log(' offset plus');
        // }
    }

    async loadMessages(){
        const messageType   = this.$route.params.messageType;
        const messageId     = parseInt(this.$route.params.messageId);
        this.subject        = this.$route.params.messageSubject;


        const { result, error } = await getNotificationThread(messageType, messageId, this.query);

        if(error){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorInboxMessageLoad',
                class: 'error'
            });

            return;
        }

        this.messages = result.messages;
        this.performer = result.performer;
        this.client = result.client;
        this.total = + result.total
    }

    async sendMessage(){
        const user: User = this.$store.state.authentication.user;

        const replyMessage: PostNotificationParams = {
            clientid: { id: user.id  },
            content: this.reply,
            performer_account: { id: this.messages[0].account_id },
            sent_by: 'CLIENT',
            status: 'INBOX',
            subject: this.subject
        };

        const { result, error } = await postNotification(replyMessage);

        if(error){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorReplyMessage',
                class: 'error'
            });

            return;
        }

        this.$store.dispatch('openMessage', {
            content: 'account.alerts.successReplyMessage',
            class: 'success'
        });

        this.loadMessages();

        this.reply = '';
    }

    async payMessage(notification: NotificationThreadsMessage){
        const user: User = this.$store.state.authentication.user;

        const payload = {
            serviceType: notification.type.toUpperCase(),
            emailId: notification.id
        };

        const { result, error } = await payNotification(user.id, notification.account_id, payload);

        if(error){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorInboxMessagePay',
                class: 'error'
            });

            return;
        }

        tagHotjar('MESSAGE_PAID');

        this.$store.dispatch('getSession');

        this.$store.dispatch('openMessage', {
            content: 'account.alerts.succesInboxMessagePay',
            class: 'success'
        });

        this.loadMessages();
    }

    async removeMessage(notification: NotificationThreadsMessage){

        const { result, error } = await removeNotificationThread(notification.type, notification.id, this.query);

        if(error){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorInboxRemove',
                class: 'error'
            });

            return;
        }

        this.$store.dispatch('openMessage', {
            content: 'account.alerts.successInboxRemove',
            class: 'success'
        });

        this.messages = result.messages;
        this.total = + result.total
    }
}