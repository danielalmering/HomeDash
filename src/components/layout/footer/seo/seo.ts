import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';
import { setTitle, setDescription, setKeywords } from '../../../../seo';

import config from '../../../../config';
import WithRender from './seo.tpl.html';
import { SeoText, SeoData } from '../../../../models/Seo';

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

    setImages(location: string){
        return `${config.ImageUrl}categories/${location}`;
    }

    get hasTabs():boolean{
        if (!this.seoTabs){
            return false;
        }

        if (this.seoTabs.length <= 1){
            return false;
        }

        return this.seoTabs[1].description != "" && this.seoTabs[1].title != "";
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