import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';
import { Route } from 'vue-router';
import { User } from '../../../../models/User';
import { openRoute, openModal } from '../../../../utils/main.util';
import config, { logoDark } from '../../../../config';

import './nav.scss';
import WithRender from './nav.tpl.html';

@WithRender
@Component
export default class Nav extends Vue {

    searchQuery: string = '';

    showMenu: boolean = false;
    showAccount: boolean = false;
    showLang: boolean = false;

    openRoute = openRoute;
    openModal = openModal;
    logo = logoDark;
    country = config.Country;

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
        return this.$store.state.info && this.$store.state.info.categories ? this.$store.state.info.categories : [];
    }

    get acceptedLanguages(){
        return this.$store.state.info && this.$store.state.info.languages ? this.$store.state.info.languages : [];
    }

    get banner(){
        let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        let size = width < 720 ? 'xs' : 'lg';
        let img = require('../../../../assets/images/' + this.country + '/navbanner-' + size +'.png');

        switch(this.country) {
            case 'nl':
                return {active: (this.$store.state.info && this.$store.state.info.marketing.current === 'action_55' ? true : false), img: img};
            case 'uk':
                return {active: true, img: img};
            case 'de':
                return {active: false, img: img};
            case 'at':
                return {active: false, img: img};
            default:
                return {active: false, img: img};
        }
    }

    closeAll(){
        this.showMenu = false;
        this.showAccount = false;
        this.showLang = false;
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
            this.$router.push({ name: 'Performers', params: { category: this.$route.params.category }, query: { search: this.searchQuery } });
            this.searchQuery = '';
        }
    }

    toggleAccountMenu(){
        this.showAccount = !this.showAccount;
    }

    closeAccountMenu(){
        this.showAccount = false;
    }

    toggleTagMenu(){
        this.showMenu = !this.showMenu;
    }

    closeTagMenu(){
        this.showMenu = false;
    }

    closeLangMenu(){
        this.showLang = false;
    }

    login(){
        this.openModal('login');
        this.closeAll();
    }

    logout(){
        this.$store.dispatch('logout');
        this.$store.dispatch('successMessage', 'auth.alerts.successlogout');
    }
}