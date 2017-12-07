import { Component, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import { Performer } from '../../../../models/Performer';
import config from '../../../../config';

import './sidebar.scss';

type SidebarCategory = 'recommended' | 'peek' | 'favourites';

@Component({
    template: require('./sidebar.tpl.html'),
})
export default class Sidebar extends Vue {

    performers: Performer[] = [];
    category: SidebarCategory = 'recommended';
    services: string[] = ["cam", "phone", "sms", "email", "videocall"];    

    query: any = {
        limit: 20,
        offset: 0,
        performer: 0,
        search: ''
    };

    categoryLoads = {
        'recommended': this.loadRecommended,
        'favourites': this.loadFavorites,
        'peek': this.loadPeek
    };

    get displaySidebar(){
        return this.$store.state.displaySidebar;
    }

    get logo(){
        return this.$store.getters.getLogoLight;
    }

    get authenticated(){
        return this.$store.getters.isLoggedIn;
    }

    get user(){
        return this.$store.state.authentication.user;
    }

    mounted(){
        this.query.performer = this.$route.params.id;
        this.loadPerformers();
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        if(this.displaySidebar){
            this.$store.commit('toggleSidebar');
        }
    }

    toggleSidebar(check: boolean){
        this.$store.commit('toggleSidebar');
    }

    hasService(performerId: number, service: string){
        const performer = this.performers.find(p => p.id === performerId);

        return !performer ? false : performer.performer_services[service];
    }

    login(){
        this.$store.dispatch('displayModal', 'login');
    }

    account(){
        this.$router.push({ name: 'Editdata' });
    }

    goToPerformer(id: number){
        this.$router.push({
            name: 'Profile',
            params: {
                id: id.toString()
            }
        });
    }

    onScroll(event: Event){
        if(!event.srcElement){
            return;
        }

        const element = event.srcElement;

        const isAtBottom = (element.scrollTop + element.clientHeight) === element.scrollHeight;

        if(isAtBottom){
            this.query.offset += 20;

            this.loadPerformers(true);
        }
    }

    search(){
        this.query.offset = 0;
        this.loadPerformers();
    }

    setCategory(category: SidebarCategory){
        if(this.category === category){
            return;
        }

        this.category = category;

        this.query.offset = 0;
        this.loadPerformers();
    }

    beforeDestroy(){
        if(this.displaySidebar){
            this.$store.commit('toggleSidebar');
        }
    }

    async loadPerformers(loadMore: boolean = false){
        const data = await this.categoryLoads[this.category]();

        if(loadMore){
            this.performers = this.performers.concat(data.performerAccounts);
        } else {
            this.performers = data.performerAccounts;
        }
    }

    async loadRecommended() {
        const performerResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/recommended?limit=${this.query.limit}&offset=${this.query.offset}&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });

        return performerResults.json();
    }

    async loadFavorites(){
        const userId = this.$store.state.authentication.user.id;

        const performerResults = await fetch(`${config.BaseUrl}/client/client_accounts/${userId}/favorite_performers?limit=${this.query.limit}&offset=${this.query.offset}&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });

        return performerResults.json();
    }

    async loadPeek(){
        const performerResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/busy?limit=${this.query.limit}&offset=${this.query.offset}&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });

        return performerResults.json();
    }
}