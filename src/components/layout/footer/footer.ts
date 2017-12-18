import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import Seo from './seo/seo';

import './footer.scss';
import WithRender from './footer.tpl.html';

@WithRender
@Component({
    components: {
        seo: Seo
    }
})
export default class Footer extends Vue {

    seo: boolean = false;

    get branding(){
        return this.$store.getters.getBranding;
    }

    mounted(){
        this.seo = this.$route.name === 'Performers';
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.seo = to.name === 'Performers';
    }


}