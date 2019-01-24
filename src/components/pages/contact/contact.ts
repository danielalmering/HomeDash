import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './contact.scss';

import config from '../../../config';
import WithRender from './contact.tpl.html';
import { PostContactPayload, postContactMessage } from 'sensejs/admin';

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

    data(){
        return {
            contact: {
                email: '',
                message: '',
                name: '',
                subject: ''
            }
        }
    }

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