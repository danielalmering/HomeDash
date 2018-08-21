import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../models/User';

import config from '../../../../config';
import WithRender from './notifications.tpl.html';

import { updateConsumer } from 'sensejs/consumer';
import { Consumer } from 'sensejs/core/models/user';

@WithRender
@Component
export default class Notifications extends Vue {

    user: Consumer;

    created(){
        this.user = Object.assign({}, this.$store.state.authentication.user);
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
}