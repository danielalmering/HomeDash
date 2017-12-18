import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import config from '../../../config';

@Component({
    template: require('./modal-recover.tpl.html')
})
export default class ModalRecover extends Vue {

    email: string = '';

    async recover(){
        if(this.email === ''){
            return;
        }

        const recoverResult = await fetch(`${config.BaseUrl}/client/client_accounts/forgot_password`, {
            credentials: 'include',
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                account: this.email
            })
        });

        this.$store.dispatch('successMessage', 'modals.recover.alerts.successMessage');

        this.close();
    }

    close(){
        this.$store.dispatch('displayModal', '');
    }
}