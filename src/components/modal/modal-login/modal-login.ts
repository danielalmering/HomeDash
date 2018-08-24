import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';
import WithRender from './modal-login.tpl.html';
import { openModal, tagHotjar } from '../../../util';
import config from '../../../config';
import router from '../../../router';

@WithRender
@Component
export default class ModalLogin extends Vue {
    email: string = '';
    password: string = '';
    openModal = openModal;

    get user(){
        return this.$store.state.authentication.user;
    }

    get FB(){
        const redirect = encodeURIComponent(`${location.protocol}//${location.host}/login/`);
        return `https://www.facebook.com/v3.1/dialog/oauth?client_id=674396449594035&redirect_uri=${redirect}&state=acc${this.user.id}`;
    }

    mounted(){
        this.sociallogin();
    }

    async login(){

        await this.$store.dispatch('login', {
            email: this.email,
            password: this.password
        });

        if(this.$store.getters.isLoggedIn){
            this.close();
            tagHotjar('LOGIN_SUCCESS');
        } else {
            tagHotjar('LOGIN_FAIL');
        }
    }

    async sociallogin(){
        const query = new URLSearchParams(window.location.search);
        const token = query.get('code');
        
        if(!query.has('code')){ return }

        const redirect  = `${location.protocol}//${location.host}/login/`;
        const encoded   = encodeURIComponent(redirect);

        const checkSessionResult = await fetch(`${config.BaseUrl}/check_session?login=2&ret=${encoded}&token=${token}`, {
            credentials: 'include'
        });

        const data = await checkSessionResult.json();
        this.$store.commit('setUser', data);

        this.$store.dispatch('closeModal');
        window.history.pushState({}, document.title, window.location.pathname);
    }

    close(){
        this.$store.dispatch('closeModal');
    }
}