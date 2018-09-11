import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../models/User';

import config from '../../../../config';
import WithRender from './editdata.tpl.html';

import { updateConsumer } from 'sensejs/consumer';
import { Consumer } from 'sensejs/core/models/user';

@WithRender
@Component
export default class Editdata extends Vue {

    user: Consumer;

    confirmPassword: string = '';
    pushcrewSubscribed: boolean = false;

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

        await this.$store.dispatch('updateUser', this.user);
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