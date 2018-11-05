import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../models/User';

import WithRender from './modal-notifications.tpl.html';
import { tagHotjar } from '../../../util';

import { updateConsumer } from 'sensejs/consumer';
import { getSubscriptionsOptions } from 'sensejs/performer/subscriptions';
import { Consumer, NotificationMode } from 'sensejs/core/models/user';

@WithRender
@Component
export default class ModalNotifications extends Vue {
    

    @Prop({
        required: true,
        type: String
    })
    title: string;

    user: Consumer;
    form: any;
    formData: any = {};

    get modalRef(){
        return this.$store.state.modals.modalRef;
    }

    data(){
        return {
            form: {
                email: this.$store.state.authentication.user.email,
                mobile_number: this.$store.state.authentication.user.mobile_number
            }
        }
    }

    created(){
        this.user = Object.assign({}, this.$store.state.authentication.user);
        this.getFormData();
    }

    async getFormData(){
        const { error, result } = await getSubscriptionsOptions();

        if(error){
            return;
        }

        this.formData = result;
    } 

    async updateNotifications(id: string){

        // Email confirmation check
        if(id === '1'){
            if(this.form.email && await this.$validator.validate('email')){
                this.user.email = this.form.email;
            } else {
                this.$store.dispatch('errorMessage', 'account.alerts.errorinvalidEmail');
                return;
            }
        }

        // Phone confirmation check
        if(id === '2' || id === '8'){
            if(this.form.mobile_number && await this.$validator.validate('phone')){
                this.user.mobile_number = this.form.mobile_number;
            } else {
                this.$store.dispatch('errorMessage', 'account.alerts.errorinvalidPhone');
                return;
            }
        }

        let payload = { user: this.user};

        this.$store.dispatch('updateUser', payload);

        this.close();
    }

    close(){
        this.$store.dispatch('displayModal', null);
    }
}