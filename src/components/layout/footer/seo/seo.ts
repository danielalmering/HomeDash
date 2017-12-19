import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';
import { setTitle, setDescription, setKeywords } from '../../../../seo';

import config from '../../../../config';
import WithRender from './seo.tpl.html';

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

@WithRender
@Component
export default class Seo extends Vue {

    seoMain: SeoText | boolean = false;
    seoTabs : SeoText[] = [];
    selectedTab: number = 0;

    seoData?: SeoData = undefined;

    mounted(){
        const category = this.$route.params.category && this.$route.params.category !== '' ? this.$route.params.category : 'home';

        this.loadSeo(category);
    }

    tabSelect(tab: number){
        this.selectedTab = tab;
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        const category = to.params.category && to.params.category !== '' ? to.params.category : 'home';

        if(this.seoData && category === this.seoData.slug){
            return;
        }

        this.loadSeo(category);
    }

    async loadSeo(category: string){
        const seoResults = await fetch(`${config.BaseUrl}/category/${category}`);
        const data: SeoData = await seoResults.json();

        this.seoMain = data.texts[0];
        this.seoTabs = data.texts.slice(1);
        this.selectedTab = this.seoTabs[0].id;

        this.seoData = data;

        setTitle(data.meta_title);
        setDescription(data.meta_description);
        setKeywords(data.meta_keywords);
    }
}