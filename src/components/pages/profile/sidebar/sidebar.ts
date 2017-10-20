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

    categoryLoads = {
        'recommended': this.loadRecommended,
        'favourites': this.loadFavorites,
        'peek': this.loadPeek
    };

    mounted(){
        this.query.performer = this.$route.params.id;

        this.loadPerformers();
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

    async loadPerformers(loadMore: boolean = false){
        var data = await this.categoryLoads[this.category]();

        if(loadMore){
            this.performers = this.performers.concat(data.performerAccounts);
        } else {
            this.performers = data.performerAccounts;
        }
    }

    async loadRecommended() {
        const performerResults = await fetch(`https://www.thuis.nl/api/performer/performer_accounts/recommended?limit=${this.query.limit}&offset=${this.query.offset}&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });

        return performerResults.json();
    }

    async loadFavorites(){
        const userId = this.$store.state.authentication.user.id;

        const performerResults = await fetch(`https://www.thuis.nl/api/client/client_accounts/${userId}/favorite_performers?limit=${this.query.limit}&offset=${this.query.offset}&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });

        return performerResults.json();
    }

    async loadPeek(){
        const performerResults = await fetch(`https://www.thuis.nl/api/performer/performer_accounts/busy?limit=${this.query.limit}&offset=${this.query.offset}&performer=${this.query.performer}&search=${this.query.search}`, {
            credentials: 'include'
        });

        return performerResults.json();
    }
}