import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';

@Component({
    template: require('./modal-login.tpl.html')
})
export default class ModalLogin extends Vue {
    @Provide() email = '';
    @Provide() password: string = '';

    login(){

        this.$store.dispatch('login', {
            email: this.email,
            password: this.password
        });

        this.$store.dispatch('displayModal', '');
    }

    register(){
        this.$store.dispatch('displayModal', 'register');
    }

    close(){
        this.$store.dispatch('displayModal', '');
    }
}