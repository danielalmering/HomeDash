import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import Pagination from 'sensejs/vue/components/pagination';
import { User } from '../../../../models/User';

import config from '../../../../config';
import WithRender from './notifications.tpl.html';

import { updateConsumer } from 'sensejs/consumer';
import { Performer } from 'sensejs/performer/performer.model';
import { getSubscriptionsOptions, listSubscriptions } from 'sensejs/performer/subscriptions';
import { Consumer } from 'sensejs/core/models/user';

@WithRender
@Component({
    components: {
        pagination: Pagination
    }
})
export default class Notifications extends Vue {

    user: Consumer;
    formData: any = {}; 
    total: number = 0;
    //subscriptions: Performer[] = [];
    subscriptions: any = [];

    query = {
        limit: 20,
        offset: 0
    };

    created(){
        this.user = Object.assign({}, this.$store.state.authentication.user);
        this.user.notification_types = this.user.notification_types ? this.user.notification_types : { SSA: false, PRO: false, MSG: false };
        
        this.getFormData();
        this.loadSubscriptions();
    }

    pageChanged(){
        this.loadSubscriptions();
    }

    async getFormData(){
        const { error, result } = await getSubscriptionsOptions();

        if(error){
            return;
        }

        this.formData = result;
    }

    async updateNotifications(){

        const { error, result } = await updateConsumer(this.user);

        if(error){
            this.$store.dispatch('errorMessage', 'account.alerts.errorEditData');
            return;
        }

        this.$store.dispatch('successMessage', 'account.alerts.successEditData');

        this.$store.commit('setUser', result);
    }

    async loadSubscriptions(){
        const userId = this.$store.state.authentication.user.id;;

        const { result, error } = await listSubscriptions(userId, this.query);

        if(error){
            return;
        }

        this.subscriptions = result.performerAccounts;
        this.total = result.total;
    }
}