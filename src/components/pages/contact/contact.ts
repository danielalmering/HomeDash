import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './contact.scss';

import config from '../../../config';
import WithRender from './contact.tpl.html';

interface Message {
    email: string;
    message: string;
    name: string;
    subject: string;
}

@WithRender
@Component
export default class Contact extends Vue {

    contact: Message = {
        email: '',
        message: '',
        name: '',
        subject: ''
    };

    async send(){
        const contactResult = await fetch(`${config.BaseUrl}/admin/contact_message`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(this.contact)
        });

        const contactData = await contactResult.json();

        if(!contactResult.ok){
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