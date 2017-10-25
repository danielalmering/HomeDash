import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './nav.scss';

@Component({
    template: require('./nav.tpl.html')
})
export default class Nav extends Vue {

    // TODO: Populate this based on country
    acceptedLanguages: string[] = ['nl', 'en'];

    searchQuery: string = '';

    showMenu: boolean = false;

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

    changeLanguage(language: string){
        this.$store.dispatch('setLanguage', language);
    }

    search(){
        //If the search query is empty we dont need an empty search query at the end of the url
        if(this.searchQuery === ''){
            this.$router.push({ name: 'Performers' });
        } else {
            this.$router.push({ name: 'Performers', query: { search: this.searchQuery } });
        }
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