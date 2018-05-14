import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import config from '../../../config';
import WithRender from './modal-recover.tpl.html';
import { tagHotjar } from '../../../util';
import { recoverPassword } from 'sensejs/auth';

@WithRender
@Component
export default class ModalRecover extends Vue {

    email: string = '';

    async recover(){
        if(this.email === ''){
            return;
        }

        await recoverPassword(this.email);

        tagHotjar(`RECOVER`);
        this.$store.dispatch('successMessage', 'modals.recover.alerts.successMessage');

        this.close();
    }

    close(){
        this.$store.dispatch('displayModal', '');
    }
}