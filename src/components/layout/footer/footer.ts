import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import Seo from './seo/seo';

import './footer.scss';

@Component({
    template: require('./footer.tpl.html'),
    components: {
        seo: Seo
    }
})
export default class Footer extends Vue {

    seo: boolean = false;

    mounted(){
        this.seo = this.$route.name === 'Performers';
    }

    @Watch('$route')
    onRouteChange(to: Route, from: Route){
        this.seo = to.name === 'Performers';
    }
}