import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import notificationSocket from '../../../../socket';
import { SocketMessageEventArgs } from '../../../../models/Socket';

import Pagination from 'sensejs/vue/components/pagination';
import { User } from '../../../../models/User';
import config from '../../../../config';
import WithRender from './inbox.tpl.html';
import { tagHotjar } from '../../../../util';
import { NotificationThreadsMessage, Notification } from 'sensejs/core/models/notification';
import { getNotificationThreads, payNotification } from 'sensejs/consumer/notification';

@WithRender
@Component({
    components: {
        pagination: Pagination
    }
})
export default class Inbox extends Vue {

    notifications: NotificationThreadsMessage[] = [];
    paymentDialogs: number[] = [];
    total: number = 0;
    messageSocket: number;

    query = {
        limit: 20,
        offset: 0
    };

    get newNotifications(){
        return (status: string) => {
            return status.search("NEW")  ? false : true;
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

    async loadInbox(){
        const user: User = this.$store.state.authentication.user;

        const { result, error } = await getNotificationThreads(this.query);

        if(error){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorInboxLoad',
                class: 'error'
            });

            return;
        }

        this.notifications = result.messages;
        this.total = + result.total
    }

    openMessage(notification: NotificationThreadsMessage){
        this.$router.push({
            name: 'Readmessages',
            params: {
                messageType: notification.type.toString(),
                messageId: notification.id.toString(),
                messageSubject: notification.subject.toString()
            }
        });
    }
}