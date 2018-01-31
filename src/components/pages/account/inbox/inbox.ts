import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import notificationSocket from '../../../../socket';
import { SocketMessageEventArgs } from '../../../../models/Socket';

import Pagination from '../../../layout/Pagination.vue';
import { User } from '../../../../models/User';
import config from '../../../../config';
import WithRender from './inbox.tpl.html';
import { tagHotjar } from '../../../../util';

interface Notification {
    id: number;
    date: number;
    performer_id: number;
    status: string;
    subject: string;
    type: string;
    checked: boolean;
}

@WithRender
@Component({
    components: {
        pagination: Pagination
    }
})
export default class Inbox extends Vue {

    notifications: Notification[] = [];
    paymentDialogs: number[] = [];
    total: number = 0;
    messageSocket: number;

    query = {
        limit: 20,
        offset: 0
    };

    get hasPaymentDialog(){
        return (id: number) => {
            return this.paymentDialogs.indexOf(id) > -1;
        };
    }

    get creditsPerType(){
        return (type: string) => {
            console.log(type);
            return this.$store.state.info[`credits_per_${type.toLocaleLowerCase()}`];
        }
    }

    async mounted(){
        await this.loadInbox();
        await this.$store.dispatch('getSession');

        this.messageSocket = notificationSocket.subscribe('message', (data: SocketMessageEventArgs) => {
            this.loadInbox();
        });
    }

    pageChanged(){
        this.loadInbox();
    }

    beforeDestroy(){
        notificationSocket.unsubscribe(this.messageSocket);
    }

    async removeMessages(){
        const deletedMessages = this.notifications.filter(n => n.checked);

        if(deletedMessages.length === 0){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorInboxNoSelected',
                class: 'error'
            });
            return;
        }

        const deleteResult = await fetch(`${config.BaseUrl}/client/client_accounts/notifications/group`, {
            method: 'DELETE',
            body: JSON.stringify({ notifications : deletedMessages }),
            credentials: 'include'
        });

        if(!deleteResult.ok){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorInboxRemove',
                class: 'error'
            });
        } else {
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.successInboxRemove',
                class: 'success'
            });

            this.pageChanged();
        }
    }

    async loadInbox(){
        const user: User = this.$store.state.authentication.user;

        const inboxResults = await fetch(`${config.BaseUrl}/client/client_accounts/${user.id}/notifications?limit=${this.query.limit}&offset=${this.query.offset}`, {
            credentials: 'include'
        });

        if(!inboxResults.ok){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorInboxLoad',
                class: 'error'
            });

            return;
        }

        const data = await inboxResults.json();

        data.notifications.forEach((notification: Notification) => notification.checked = false);

        this.notifications = data.notifications;
        this.total = data.total;
    }

    openMessage(notification: Notification, force = false){

        if(notification.status !== 'NEW' || force){

            this.$router.push({
                name: 'Readmessage',
                params: {
                    messageid: notification.id.toString(),
                    performerid: notification.performer_id.toString()
                }
            });

            return;
        }

        this.paymentDialogs.push(notification.id);
    }

    async payMessage(notification: Notification){
        const user: User = this.$store.state.authentication.user;

        const payload = {
            serviceType: notification.type.toUpperCase(),
            emailId: notification.id
        };

        const paymessageResult = await fetch(`${config.BaseUrl}/client/client_accounts/${user.id}/tax/performer_accounts/${notification.performer_id}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            credentials: 'include',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });

        if(!paymessageResult.ok){
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

        this.openMessage(notification, true);
    }
}