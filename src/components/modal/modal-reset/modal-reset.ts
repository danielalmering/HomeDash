import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import config from '../../../config';
import WithRender from './modal-reset.tpl.html';
import { tagHotjar } from '../../../util';
import { resetPassword } from 'sensejs/auth';

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

        const { error } = await resetPassword({
            id: parseInt(userId),
            password: this.password,
            token: token
        });

        if(error){
            tagHotjar(`RESET_FAIL`);
            this.$store.dispatch('errorMessage', 'modals.reset.alerts.errorMessage');
        } else {
            tagHotjar('RESET_SUCCESS');
            this.$store.dispatch('successMessage', 'modals.reset.alerts.successMessage');
        }

        this.close();
    }

    close(){
        this.$store.dispatch('displayModal', null);

        this.$router.push({
            name: 'Performers'
        });
    }
}