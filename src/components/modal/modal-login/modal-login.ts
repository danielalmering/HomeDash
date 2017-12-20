import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';
import WithRender from './modal-login.tpl.html';

@WithRender
@Component
export default class ModalLogin extends Vue {
    email: string = '';
    password: string = '';

    async login(){

        await this.$store.dispatch('login', {
            email: this.email,
            password: this.password
        });

        if(this.$store.getters.isLoggedIn){
            this.close();
        }
    }

    register(){
        this.$store.dispatch('displayModal', 'register');
    }

    forgotPassword(){
        this.$store.dispatch('displayModal', 'recover');
    }

    close(){
        this.$store.dispatch('closeModal');
    }
}