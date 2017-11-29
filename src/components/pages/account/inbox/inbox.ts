import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Pagination from '../../../layout/Pagination';
import { User } from '../../../../models/User';
import config from '../../../../config';

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
    selectedMessages: any[] = [];
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

    selectMessages(id: number){
        // if(this.selectedMessages.indexOf(id) >= 0) == false){

        // }

        console.log(this.selectedMessages);
    }

    removeMessage(){

    }

    async loadInbox(){
        const user: User = this.$store.state.authentication.user;

        const inboxResults = await fetch(`${config.BaseUrl}/client/client_accounts/${user.id}/notifications?limit=${this.query.limit}&offset=${this.query.offset}`, {
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