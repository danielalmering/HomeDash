import { Component } from 'vue-property-decorator';
import Vue from 'vue';

import './contact.scss';

import WithRender from './contact.tpl.html';
import { PostContactPayload, postContactMessage } from 'sensejs/admin';

import { Validations } from 'vuelidate-property-decorators';
import { required, email } from 'vuelidate/lib/validators';

interface Message {
    email: string;
    message: string;
    name: string;
    subject: string;
}

@WithRender
@Component
export default class Contact extends Vue {

    contact: PostContactPayload;
<<<<<<< HEAD
    
    data(){                
=======

    data(){
>>>>>>> d3d3154bbd6766c0207d2bb639209aeb83c26813
        return {
            contact: {
                email: '',
                message: '',
                name: '',
                subject: ''
            }
        };
    }
<<<<<<< HEAD
   
=======

>>>>>>> d3d3154bbd6766c0207d2bb639209aeb83c26813
    @Validations()
    validations = {
        contact: {
            email: {email},
            message: {required},
            name: {required},
            subject: {required}
        }
    };

    async send(){
        const { error } = await postContactMessage(this.contact);

        if(error){
            this.$store.dispatch('errorMessage', 'contact.alerts.errorSend');
        } else {
            this.$store.dispatch('successMessage', 'contact.alerts.successSend');

            this.contact = {
                email: '',
                message: '',
                name: '',
                subject: ''
            };
        }
    }

}