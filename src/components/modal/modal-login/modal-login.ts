import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';
import WithRender from './modal-login.tpl.html';
import { openModal } from '../../../util';

@WithRender
@Component
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
        }
    }

    close(){
        this.$store.dispatch('closeModal');
    }
}