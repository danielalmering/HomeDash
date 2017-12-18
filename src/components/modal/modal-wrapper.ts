import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import modalLogin from './modal-login/modal-login';
import modalRegister from './modal-register/modal-register';
import modalRecover from './modal-recover/modal-recover';
import modalReset from './modal-reset/modal-reset';

import './modal-wrapper.scss';

@Component({
    template: require('./modal-wrapper.tpl.html'),
    components: {
        login: modalLogin,
        register: modalRegister,
        recover: modalRecover,
        reset: modalReset
    }
})
export default class ModalWrapper extends Vue {

    get activeModal(){
        return this.$store.state.modals.activeModal;
    }

    mounted(){
        // this.$store.dispatch('displayModal', 'login');
    }
}