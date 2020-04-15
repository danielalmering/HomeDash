import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';

import WithRender from './modal-notifications.tpl.html';
import { getSubscriptionsOptions } from 'sensejs/performer/subscriptions';
import { Consumer } from 'sensejs/core/models/user';

import { Validations } from 'vuelidate-property-decorators';
import { email } from 'vuelidate/lib/validators';

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
        };
    }

    @Validations()
    validations = {
        form: {
            email: {email},
            mobile_number: {
                isCorrectPhone(phonenumber: string) {
                    const regex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
                    return regex.test(phonenumber);
                }
            }
        }
    };

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
            if(this.form.email){
                this.user.email = this.form.email;
            } else {
                this.$store.dispatch('errorMessage', 'account.alerts.errorinvalidEmail');
                return;
            }
        }

        // Phone confirmation check
        if(id === '2' || id === '8'){
            if(this.form.mobile_number){
                this.user.mobile_number = this.form.mobile_number;
            } else {
                this.$store.dispatch('errorMessage', 'account.alerts.errorinvalidPhone');
                return;
            }
        }

        const payload = { user: this.user};

        this.$store.dispatch('updateUser', payload);

        this.close();
    }

    close(){
        this.$store.dispatch('displayModal', undefined);
    }
}