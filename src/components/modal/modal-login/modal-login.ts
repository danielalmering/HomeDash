import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';

@Component({
    template: require('./modal-login.tpl.html')
})
export default class ModalLogin extends Vue {
    email: string = '';
    password: string = '';

    async login(){

        await this.$store.dispatch('login', {
            email: this.email,
            password: this.password
        });

        this.close();
    }

    register(){
        this.$store.dispatch('displayModal', 'register');
    }

    close(){
        this.$store.dispatch('closeModal');
    }
}