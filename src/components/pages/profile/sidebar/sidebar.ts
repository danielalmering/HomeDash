import { Component, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import { Performer } from '../../../../models/Performer';

import './sidebar.scss';

type SidebarCategory = 'recommended' | 'peek' | 'favourites';

@Component({
    template: require('./sidebar.tpl.html'),
})
export default class Sidebar extends Vue {

    performers: Performer[] = [];
    category: SidebarCategory = 'recommended';

    query: any = {
        limit: 20,
        offset: 0,
        performer: 0,
        search: ''
    }

    mounted(){
        this.query.performer = this.$route.params.id;

        this.loadRecommended();
    }

    goToPerformer(id: number){
        this.$router.push({
            name: 'Profile',
            params: {
                id: id.toString()
            }
        });
    }

    search(){
        if(this.query.search === ''){
            return;
        }

        this.loadPerformers();
    }

    setCategory(category: SidebarCategory){
        if(this.category === category){
            return;
        }

        this.category = category;

        this.loadPerformers();
    }

    loadPerformers(){
        if(this.category === 'recommended'){
            this.loadRecommended();
        } else if(this.category === 'favourites'){
            this.loadFavorites();
        } else {
            this.loadPeek();
        }
    }

    async loadRecommended(){
        const performerResults = await fetch(`https://www.thuis.nl/api/performer/performer_accounts/recommended?limit=20&offset=0&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });
        const data = await performerResults.json();

        this.performers = data.performerAccounts;
    }

    async loadFavorites(){
        const userId = this.$store.state.authentication.user.id;

        const performerResults = await fetch(`https://www.thuis.nl/api/client/client_accounts/${userId}/favorite_performers?limit=20&offset=0&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });
        const data = await performerResults.json();

        this.performers = data.performerAccounts;
    }

    async loadPeek(){
        const performerResults = await fetch(`https://www.thuis.nl/api/performer/performer_accounts/busy?limit=20&offset=0&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });
        const data = await performerResults.json();

        this.performers = data.performerAccounts;
    }
}