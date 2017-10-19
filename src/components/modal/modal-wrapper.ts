import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import modalLogin from './modal-login/modal-login';
import modalRegister from './modal-register/modal-register';

import './modal-wrapper.scss';

@Component({
    template: require('./modal-wrapper.tpl.html'),
    components: {
        login: modalLogin,
        register: modalRegister
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