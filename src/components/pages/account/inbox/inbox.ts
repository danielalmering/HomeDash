import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Pagination from '../../../layout/Pagination';
import { User } from '../../../../models/User';

interface Notification {
    id: number;
    date: number;
    performer_id: number;
    status: string;
    subject: string;
    type: string;
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

    async loadInbox(){
        const user: User = this.$store.state.authentication.user;

        const inboxResults = await fetch(`https://www.thuis.nl/api/client/client_accounts/${user.id}/notifications?limit=${this.query.limit}&offset=${this.query.offset}`, {
            credentials: 'include'
        });

        if(!inboxResults.ok){
            return; //TODO: Error message
        }

        const data = await inboxResults.json();

        this.notifications = data.notifications;
        this.total = data.total;
    }
}