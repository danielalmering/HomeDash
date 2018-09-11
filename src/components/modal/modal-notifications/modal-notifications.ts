import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../models/User';

import WithRender from './modal-notifications.tpl.html';
import { tagHotjar } from '../../../util';

import { updateConsumer } from 'sensejs/consumer';
import { getSubscriptionsOptions } from 'sensejs/performer/subscriptions';
import { Consumer } from 'sensejs/core/models/user';

@WithRender
@Component
export default class ModalNotifications extends Vue {

    @Prop({
        required: true,
        type: Boolean
    })
    title: boolean;

    user: Consumer;
    formData: any = {}; 

    created(){
        this.user = Object.assign({}, this.$store.state.authentication.user);
        this.user.notification_types = this.user.notification_types ? this.user.notification_types : { SSA: false, PRO: false, MSG: false };
        
        this.getFormData();
    }

    async getFormData(){
        const { error, result } = await getSubscriptionsOptions();

        if(error){
            return;
        }

        this.formData = result;
    }

    async updateNotifications(){

        await this.$store.dispatch('updateUser', this.user);
        
        this.close();
    }

    close(){
        this.$store.dispatch('displayModal', '');
    }
}