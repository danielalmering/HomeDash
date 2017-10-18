import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './nav.scss';

@Component({
    template: require('./nav.tpl.html')
})
export default class Nav extends Vue {

    get authenticated(){
        return this.$store.state.authentication.loggedIn;
    }

    get user(){
        return this.$store.state.authentication.user;
    }

    get language(){
        return this.$store.state.localization.language;
    }

    login(){
        if(this.authenticated){
            return;
        }

        this.$store.dispatch('displayModal', 'login');
    }

    logout(){
        this.$store.dispatch('logout');
    }
}