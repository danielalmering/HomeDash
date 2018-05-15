import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { getAvatarImage, getPerformerStatus } from '../../../../../util';
import { Route } from 'vue-router';
import { User } from '../../../../../models/User';

import config from '../../../../../config';
import WithRender from './readmessage.tpl.html';
import { getNotification, PostNotificationParams, postNotification } from 'sensejs/consumer/notification';

@WithRender
@Component
export default class Readmessage extends Vue {

    message: any = { client: { id: 0 }, performer_account: { id: 0 }, subject: ''};
    reply: string = '';

    getAvatarImage = getAvatarImage;
    getPerformerStatus = getPerformerStatus;

    get messageLoaded(){
        return this.message.performer_account.id > 0;
    }

    async mounted(){
        await this.loadMessage();
        await this.$store.dispatch('getSession');
    }

    async loadMessage(){
        const performerId = parseInt(this.$route.params.performerid);
        const messageId = parseInt(this.$route.params.messageid);

        const { result, error } = await getNotification(performerId, messageId);

        if(error){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorInboxMessageLoad',
                class: 'error'
            });

            return;
        }

        this.message = result;
    }

    async sendMessage(){

        const replyMessage: PostNotificationParams = {
            clientid: { id: this.message.client.id  },
            content: this.reply,
            performer_account: { id: this.message.performer_account.id },
            sent_by: 'CLIENT',
            status: 'INBOX',
            subject: this.message.subject
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

        this.reply = '';
    }
}