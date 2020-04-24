import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './textpages.scss';
import WithRender from './textpages.tpl.html';

@WithRender
@Component
export default class Textpages extends Vue {

    pagetitle: string;

    created(){
        this.pagetitle = this.$route.name ? this.$route.name.toLowerCase() : '';
    }

    get pages(){
        let country = this.$store.state.authentication.user.country;
        const page = this.$route.name ? this.$route.name.toLowerCase() : false;

        if(country === 'at') country = 'de';

        const pagedata = require(`./${page}.data.json`);
        return pagedata[country];
    }

}