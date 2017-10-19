import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './footer.scss';

@Component({
    template: require('./footer.tpl.html')
})
export default class Footer extends Vue {

    seo: any[] = [];
    seotabs : any[] = [];


    mounted(){
        this.loadSeo();
    }

    async loadSeo(){
        const seoResults = await fetch(`https://www.thuis.nl/api/category/home`);
        const data = await seoResults.json();

        this.seo = data;
        this.seotabs = data.texts;
    }

}