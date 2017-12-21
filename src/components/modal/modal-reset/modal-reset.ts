import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import config from '../../../config';
import WithRender from './modal-reset.tpl.html';

@WithRender
@Component
export default class ModalReset extends Vue {

    password: string = '';
    passwordConfirm: string = '';

    async reset(){
        if(this.password === '' || this.passwordConfirm === ''){
            this.$store.dispatch('errorMessage', 'modals.reset.alerts.errorEmptyFields');
            return;
        }

        if(this.password !== this.passwordConfirm){
            this.$store.dispatch('errorMessage', 'modals.reset.alerts.errorPasswordMismatch');
            return;
        }

        const userId = this.$route.params.userId;
        const token = this.$route.params.token;

        const resetResult = await fetch(`${config.BaseUrl}/client/client_accounts/reset_password`, {
            credentials: 'include',
            method: 'PUT',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                id: userId,
                password: this.password,
                token: token
            })
        });

        if(!resetResult.ok){
            this.$store.dispatch('errorMessage', 'modals.reset.alerts.errorMessage');
        } else {
            this.$store.dispatch('successMessage', 'modals.reset.alerts.successMessage');
        }

        this.close();
    }

    close(){
        this.$store.dispatch('displayModal', '');

        this.$router.push({
            name: 'Performers'
        });
    }
}