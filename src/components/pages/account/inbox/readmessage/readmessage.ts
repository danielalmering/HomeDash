import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { getAvatarImage, getPerformerStatus } from '../../../../../util';
import { Route } from 'vue-router';
import { User } from '../../../../../models/User';

import config from '../../../../../config';
import WithRender from './readmessage.tpl.html';

@WithRender
@Component
export default class Readmessage extends Vue {

    message: any = { client: { id: 0 }, performer_account: { id: 0 }, subject: ''};
    reply: string = '';

    getAvatarImage = getAvatarImage;
    getPerformerStatus = getPerformerStatus;

    mounted(){
        this.loadMessage();
    }

    async loadMessage(){
        const messageResults = await fetch(`${config.BaseUrl}/performer/performer_account/${this.$route.params.performerid}/email/${this.$route.params.messageid}`, {
            credentials: 'include'
        });

        if(!messageResults.ok){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorInboxMessageLoad',
                class: 'error'
            });

            return;
        }

        this.message = await messageResults.json();

    }

    async sendMessage(){

        const replymessage = {
            attachments: [],
            clientid: { id: this.message.client.id  },
            content: this.reply,
            performer_account: { id: this.message.performer_account.id },
            sent_by: 'CLIENT',
            status: 'INBOX',
            subject: this.message.subject
        };

        const newmessageResult = await fetch(`${config.BaseUrl}/performer/performer_account/${this.message.performer_account.id}/email`, {
            method: 'POST',
            body: JSON.stringify(replymessage),
            credentials: 'include'
        });

        if(!newmessageResult.ok){
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