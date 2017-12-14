import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';
import { UserForm } from '../../../models/User';

@Component({
    template: require('./modal-register.tpl.html')
})
export default class ModalRegister extends Vue {
    
    userForm: UserForm = {
        username: '',
        email: '',
        language: '',
        country: '',
        password: '',
        passwordconfirm: ''
    }

    get languages(){
        return this.$store.state.info.languages;
    }

    get countries(){
        return this.$store.state.info.countries;
    }

    async register(){
        try {
            await this.$store.dispatch('register', this.userForm);
            
            this.$store.dispatch('successMessage', 'modals.register.alerts.successMessage');
            this.close();
        } catch {
            this.$store.dispatch('errorMessage', 'modals.register.alerts.errorMessage');
        }
    }

    close(){
        this.$store.dispatch('displayModal', '');
    }
}