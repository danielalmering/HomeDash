import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../models/User';

import config from '../../../../config';
import WithRender from './editdata.tpl.html';

@WithRender
@Component
export default class Editdata extends Vue {

    user: User;

    confirmPassword: string = '';

    created(){
        this.user = Object.assign({}, this.$store.state.authentication.user);
    }

    async updateUser(){
        if(this.user.password && this.user.password !== this.confirmPassword){
            this.$store.dispatch('errorMessage', 'modals.reset.alerts.errorPasswordMismatch');
            return;
        }

        const userResult = await fetch(`${config.BaseUrl}/client/client_accounts/${this.user.id}`, {
            method: 'PUT',
            body: JSON.stringify(this.user),
            credentials: 'include'
        });

        if(!userResult.ok){
            this.$store.dispatch('errorMessage', 'account.alerts.errorEditData');
            return;
        }

        this.$store.dispatch('successMessage', 'account.alerts.successEditData');

        const userData = await userResult.json();

        this.$store.commit('setUser', userData);
    }

    subscribePushMessages(){
        window._pcq.push(['triggerOptIn', {
            subscriberSegment: 'homepage',
            modal: {
                text: 'HYEEEEEEEEEEEEEY', blackenBackground: true
            }
        }]);
    }
}