import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Pagination from '../../../layout/Pagination.vue';
import { User } from '../../../../models/User';
import config from '../../../../config';

interface Notification {
    id: number;
    date: number;
    performer_id: number;
    status: string;
    subject: string;
    type: string;
    checked: boolean;
}

@Component({
    template: require('./inbox.tpl.html'),
    components: {
        pagination: Pagination
    }
})
export default class Inbox extends Vue {

    notifications: Notification[] = [];
    total: number = 0;

    query = {
        limit: 20,
        offset: 0
    };

    mounted(){
        this.loadInbox();
    }

    pageChanged(){
        this.loadInbox();
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
}