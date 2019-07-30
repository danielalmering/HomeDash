import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';
import WithRender from './modal-login.tpl.html';
import { openModal, tagHotjar } from '../../../util';
import Sociallogin from './../../layout/Sociallogin.vue';
import config from '../../../config';
import router from '../../../router';

@WithRender
@Component({
    components: {
        sociallogin: Sociallogin
    }
})
export default class ModalLogin extends Vue {
    email: string = '';
    password: string = '';
    openModal = openModal;

    async login(){

        await this.$store.dispatch('login', {
            email: this.email,
            password: this.password
        });

        if(this.$store.getters.isLoggedIn){
            this.close();
            tagHotjar('LOGIN_SUCCESS');
            window.localStorage.removeItem(`${config.StorageKey}.safeMode`);
        } else {
            tagHotjar('LOGIN_FAIL');
        }
    }

    close(){
        this.$store.dispatch('closeModal');
    }
}