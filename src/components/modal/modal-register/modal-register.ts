import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';
import { UserForm } from '../../../models/User';
import WithRender from './modal-register.tpl.html';
import Sociallogin from './../../layout/Sociallogin.vue';
import { openModal, tagHotjar } from '../../../util';

@WithRender
@Component({
    components: {
        sociallogin: Sociallogin
    }
})
export default class ModalRegister extends Vue {

    userForm: UserForm = {
        username: '',
        email: '',
        language: this.$store.state.localization.language,
        country: this.$store.state.localization.country,
        password: '',
        passwordconfirm: ''
    };
    openModal = openModal;

    async register(){
        try {
            await this.$store.dispatch('register', this.userForm);

            this.$store.dispatch('successMessage', 'modals.register.alerts.successMessage');
            this.close();

            tagHotjar('REGISTER_SUCCESS');
        } catch {
            this.$store.dispatch('errorMessage', 'modals.register.alerts.errorMessage');

            tagHotjar('REGISTER_FAIL');
        }
    }

    close(){
        this.$store.dispatch('displayModal', null);
    }
}