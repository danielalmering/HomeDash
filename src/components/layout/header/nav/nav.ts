import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';
import { Route } from 'vue-router';

import './nav.scss';
import WithRender from './nav.tpl.html';

@WithRender
@Component
export default class Nav extends Vue {

    // TODO: Populate this based on country
    acceptedLanguages: string[] = ['nl', 'en'];

    searchQuery: string = '';

    showMenu: boolean = false;
    showAccount: boolean = false;
    showLang: boolean = false;

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.showMenu = false;
        this.showAccount = false;
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

    get logo(){
        return this.$store.getters.getLogoDark;
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
        }
    }

    toggleAccountMenu(){
        this.showAccount = !this.showAccount;
    }

    login(){
        this.$store.dispatch('displayModal', 'login');
    }

    logout(){
        this.$store.dispatch('logout');
        this.$router.push({ name: 'Performers' });
    }
}