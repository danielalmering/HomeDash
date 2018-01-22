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

    displaySeo: boolean = false;

    get branding(){
        return this.$store.getters.getBranding;
    }

    get isSafeMode(){
        return this.$store.state.safeMode;
    }

    mounted(){
        this.displaySeo = this.$route.name === 'Performers' && !this.isSafeMode;
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.displaySeo = to.name === 'Performers' && !this.isSafeMode;
    }
}