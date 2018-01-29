import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';
import { setTitle, setDescription, setKeywords } from '../../../../seo';

import config from '../../../../config';
import WithRender from './seo.tpl.html';
import { SeoText, CategoryData } from 'SenseJS/core/models/Category';
import { getCategory } from 'SenseJS/consumer/Category';

@WithRender
@Component
export default class Seo extends Vue {

    selectedTab: number = 0;

    seoData?: CategoryData = undefined;

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
        if (!this.seoData || !this.seoData.texts){
            return false;
        }

        if (this.seoData.texts.length <= 1){
            return false;
        }

        return this.seoData.texts[1].description != "" && this.seoData.texts[1].title != "";
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

        this.seoData = result;
        this.selectedTab = result.texts[0].id;

        setTitle(result.meta_title);
        setDescription(result.meta_description);
        setKeywords(result.meta_keywords);
    }
}