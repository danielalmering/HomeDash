import { Component, Prop, Provide } from 'vue-property-decorator';
import Vue from 'vue';

import './modal-login.scss';

@Component({
    template: require('./modal-login.tpl.html')
})
export default class ModalLogin extends Vue {
    @Provide() email = '';
    @Provide() password: string = '';

    login(){
        // console.log(this.userData.username);
        // this.username = 'hiya';

        this.$store.dispatch('login', {
            email: this.email,
            password: this.password
        });
    }
}