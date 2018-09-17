import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../models/User';

import config from '../../../../config';
import { openRoute } from '../../../../util';
import WithRender from './editdata.tpl.html';

import { updateConsumer, removeConsumer } from 'sensejs/consumer';
import { Consumer } from 'sensejs/core/models/user';

@WithRender
@Component
export default class Editdata extends Vue {

    user: Consumer;

    confirmPassword: string = '';
    confirmDelete: boolean = false;
    pushcrewSubscribed: boolean = false;

    openRoute = openRoute;

    created(){
        this.user = Object.assign({}, this.$store.state.authentication.user);

        window._pcq.push(['APIReady', () => {
            this.pushcrewSubscribed = window.pushcrew.subscriberId !== false && window.pushcrew.subscriberId !== null;
        }]);

        window._pcq.push(['subscriptionSuccessCallback', () => {
            this.pushcrewSubscribed = true;
        }]);

        window._pcq.push(['subscriptionFailureCallback', () => {
            this.pushcrewSubscribed = false;
        }]);
    }

    async updateUser(){
        if(this.user.password && this.user.password !== this.confirmPassword){
            this.$store.dispatch('errorMessage', 'modals.reset.alerts.errorPasswordMismatch');
            return;
        }

        const { error, result } = await updateConsumer(this.user);

        if(error){
            this.$store.dispatch('errorMessage', 'account.alerts.errorEditData');
            return;
        }

        this.$store.dispatch('successMessage', 'account.alerts.successEditData');

        this.$store.commit('setUser', result);
    }

    async removeUser(approven: boolean){

        if(approven){
            this.confirmDelete = true;
            return;
        }

        const { error, result } = await removeConsumer(this.user);

        if(error){
            this.$store.dispatch('errorMessage', 'account.alerts.errorRemoveAccount');
            return;
        }

        this.confirmDelete = false;
        this.$store.dispatch('successMessage', 'account.alerts.successRemoveAccount');

        this.$store.dispatch('logout');
        this.openRoute('Performers');
    }

    subscribePushMessages(){
        window._pcq.push(['triggerOptIn', {
            subscriberSegment: 'homepage',
            modal: {
                text: '', blackenBackground: true
            }
        }]);
    }
}