import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';
import { setTitle, setDescription, setKeywords } from '../../../../seo';

import config from '../../../../config';
import WithRender from './seo.tpl.html';
import { SeoText, CategoryData } from 'sensejs/core/models/category';
import { getCategory } from 'sensejs/consumer/category';

@WithRender
@Component
export default class Seo extends Vue {

    seoMain: SeoText | boolean = false;
    seoTabs : SeoText[] = [];
    selectedTab: number = 0;

    seoData?: CategoryData = undefined;

    async mounted(){
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

        return this.seoTabs[1].description != '' && this.seoTabs[1].title != '';
    }

    get isVisible(){
        return this.$route.name === 'Performers' && !this.isSafeMode;
    }

    get isSafeMode(){
        return this.$store.state.safeMode;
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        const category = to.params.category && to.params.category !== '' ? to.params.category : 'home';

        if((this.seoData && category === this.seoData.slug) || to.name !== 'Performers'){
            return;
        }

        this.loadSeo(category);
    }

    async loadSeo(category: string){
        const { result, error } = await getCategory(category);

        if(error){
            return;
        }

        this.seoMain = result.texts[0];
        this.seoTabs = result.texts.slice(1);
        this.selectedTab = this.seoTabs[0].id;

        this.seoData = result;

        setTitle(result.meta_title);
        setDescription(result.meta_description);
        setKeywords(result.meta_keywords);
    }
}