import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';
import { Route } from 'vue-router';
import { User } from '../../../../models/User';
import config from '../../../../config';

import './nav.scss';
import WithRender from './nav.tpl.html';

@WithRender
@Component
export default class Nav extends Vue {

    searchQuery: string = '';

    showMenu: boolean = false;
    showAccount: boolean = false;
    showLang: boolean = false;

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.closeAll();
    }

    get authenticated(){
        return this.$store.getters.isLoggedIn;
    }

    get user(){
        return this.$store.state.authentication.user;
    }

    get language(){
        return this.$store.state.localization.language;
    }

    get categories(){
        return this.$store.state.info ? this.$store.state.info.categories : [];
    }

    get acceptedLanguages(){
        return this.$store.state.info.languages ? this.$store.state.info.languages : [];
    }

    get logo(){
        return this.$store.getters.getLogoDark;
    }

    closeAll(){
        this.showMenu = false;
        this.showAccount = false;
    }

    changeLanguage(language: string){
        this.$store.dispatch('setLanguage', language);
        this.showLang = true;
    }

    search(){
        //If the search query is empty we dont need an empty search query at the end of the url
        if(this.searchQuery === ''){
            this.$router.push({ name: 'Performers' });
        } else {
            this.$router.push({ name: 'Performers', query: { search: this.searchQuery } });
            this.searchQuery = '';
        }
    }

    toggleAccountMenu(){
        this.showAccount = !this.showAccount;
    }

    login(){
        this.$store.dispatch('displayModal', 'login');
        this.closeAll();
    }

    logout(){
        this.$store.dispatch('logout');
        this.$router.push({ name: 'Performers' });
    }
}