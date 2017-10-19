import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';

@Component({
    template: require('./modal-register.tpl.html')
})
export default class ModalRegister extends Vue {
    @Provide() username = '';
    @Provide() email = '';
    @Provide() language = '';
    @Provide() country = '';
    @Provide() password: string = '';
    @Provide() passwordconfirm: string = '';

    register(){
        this.$store.dispatch('register', {
            username: this.username,
            email: this.email,
            language: this.language,
            country: this.country,
            password: this.password,
            passwordconfirm: this.passwordconfirm
        });
    }

    close(){
        this.$store.dispatch('displayModal', '');
    }
}