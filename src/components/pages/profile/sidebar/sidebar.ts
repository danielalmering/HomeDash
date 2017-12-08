import { Component, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import { Performer } from '../../../../models/Performer';
import config from '../../../../config';

import './sidebar.scss';
import JSMpeg from '../../videochat/streams/jsmpeg';

type SidebarCategory = 'recommended' | 'peek' | 'favourites' | 'voyeur';

@Component({
    template: require('./sidebar.tpl.html'),
    components: {
        jsmpeg: JSMpeg
    }
})
export default class Sidebar extends Vue {

    performers: Performer[] = [];
    category: SidebarCategory = 'recommended';
    showSidebar: boolean = false;

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

    get logo(){
        return this.$store.getters.getLogoLight;
    }

    get authenticated(){
        return this.$store.getters.isLoggedIn;
    }

    get user(){
        return this.$store.state.authentication.user;
    }

    get voyeurTiles(){
        return this.$store.state.voyeur.activeTiles;
    }

    get isVoyeurActive(){
        return this.$store.state.voyeur.isActive;
    }

    @Watch('isVoyeurActive')
    onVoyeurStateChange(newValue: boolean){
        //When voyeur gets activated switch the voyeur tab, when the session ends, switch back
        this.setCategory(newValue ? 'voyeur' : 'recommended');
    }

    mounted(){
        this.query.performer = this.$route.params.id;

        this.loadPerformers();
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

    swap(performerId: number){
        this.$store.dispatch('voyeur/swap', {
            performerId: performerId
        });
    }

    async loadPerformers(loadMore: boolean = false){
        if(this.category === 'voyeur'){
            return;
        }

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