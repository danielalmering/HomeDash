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
        limit: 5,
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

    handleScroll(el: any){
        const elHeight = el.target.scrollTop + el.target.offsetHeight;

        if(elHeight >= el.target.scrollHeight){
            const pages = Math.round(this.total / this.query.limit);
            if((pages * this.query.limit) > this.query.offset) {
                this.query.offset = this.query.offset + this.query.limit;
                this.loadMessages();
            }
        }
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

        for (let message of result.messages) {
            this.messages.push(message);
        }

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

        const addMessage = {
            account_id: this.messages[0].account_id,
            date: result.date,
            folder: result.status,
            content: result.content,
            id: result.id,
            type: 'email'
        }

        this.messages.push(addMessage);

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

        notification.billing_status = 'PAID';
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

        const removeIndex = this.messages.map(function(message: NotificationThreadsMessage) { return message.id; }).indexOf(notification.id);
        this.messages.splice(removeIndex, 1);

        this.total = + result.total
    }
}