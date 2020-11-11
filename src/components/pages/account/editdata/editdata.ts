import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import { openRoute } from '../../../../utils/main.util';
import WithRender from './editdata.tpl.html';

import { Consumer } from 'sensejs/core/models/user';

import { Validations } from 'vuelidate-property-decorators';
import { required, email } from 'vuelidate/lib/validators';

@WithRender
@Component
export default class Editdata extends Vue {

    user: Consumer;

    confirmPassword: string = '';
    pushcrewSubscribed: boolean = false;

    openRoute = openRoute;

    data(){
        return {
            user: {
                username: '',
                email: '',
                mobile_number: ''
            }
        };
    }

    @Validations()
    validations = {
        user: {
            username: {required},
            email: {email},
            mobile_number: {
                isCorrectPhone(phonenumber: string) {
                    const regex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
                    const hasphone = phonenumber.length ? regex.test(phonenumber) : true;
                    return hasphone;
                }
            }
        }
    };

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

        const payload = { user: this.user};
        await this.$store.dispatch('updateUser', payload);
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