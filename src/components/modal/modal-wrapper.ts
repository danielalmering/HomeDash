import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import modalLogin from './modal-login/modal-login';
import modalRegister from './modal-register/modal-register';
import modalRecover from './modal-recover/modal-recover';
import modalReset from './modal-reset/modal-reset';
import modalNotifications from './modal-notifications/modal-notifications';

import './modal-wrapper.scss';
import WithRender from './modal-wrapper.tpl.html';

@WithRender
@Component({
    components: {
        login: modalLogin,
        register: modalRegister,
        recover: modalRecover,
        reset: modalReset,
        notifications: modalNotifications
    }
})
export default class ModalWrapper extends Vue {

    get activeModal(){
        return this.$store.state.modals.activeModal;
    }

}