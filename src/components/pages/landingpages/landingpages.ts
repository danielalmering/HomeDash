import { Component, Prop } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import './landingpages.scss';

import config from '../../../config';
import WithRender from './landingpages.tpl.html';
import { getAvatarImage } from '../../../utils/main.util';
import { listPerformers } from 'sensejs/performer';
import { Performer } from 'sensejs/performer/performer.model';

export const pages = require(`./pages.json`);

@WithRender
@Component
export default class Landingpage extends Vue {

    page: any;
    performers: Performer[] = [];
    country = config.Country;
    getAvatarImage = getAvatarImage;
    slogan = pages[this.country].slogan;

    mounted(){
        this.page = (this.$route.params.landingpage === pages[this.country].name) ? this.$route.params.landingpage : this.$router.push({name: 'Performers'});

        this.loadSelectedPerformers();
    }

    async loadSelectedPerformers(){
        const performersResult = await fetch(`${config.BaseUrl}/performer/performer_accounts_ids?limit=6&offset=0&ids=${pages[this.country].performerIds}`, {
            credentials: 'include'
        });

        if(!performersResult.ok){
            this.$router.push({ name: 'Performers' });
        }

        const result = await performersResult.json();
        this.performers = result.performerAccounts;
    }
}