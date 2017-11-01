import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import config from '../../../../config';

interface SeoText {
    id: number;
    description: string;
    image_location: string;
    image_position: string;
    image_title: string;
    order: number;
    title: string;
}

interface SeoData {
    id: number;
    language: string;
    slug: string;
    meta_description: string;
    meta_keywords: string;
    meta_title: string;
    texts: SeoText[];
}

@Component({
    template: require('./seo.tpl.html')
})
export default class Seo extends Vue {

    seoMain: SeoText | boolean = false;
    seoTabs : SeoText[] = [];
    selectedTab: number = 0;

    mounted(){
        this.loadSeo('home');
    }

    tabSelect(tab: number){
        this.selectedTab = tab;
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.loadSeo(to.params.category);
    }

    async loadSeo(category: string){
        const seoResults = await fetch(`${config.BaseUrl}/category/${category}`);
        const data: SeoData = await seoResults.json();

        this.seoMain = data.texts[0];
        this.seoTabs = data.texts.slice(1);
        this.selectedTab = this.seoTabs[0].id;
    }
}