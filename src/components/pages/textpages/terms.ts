import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './textpages.scss';
import WithRender from './terms.tpl.html';

@WithRender
@Component
export default class Terms extends Vue {

    get terms(){
        let country = this.$store.state.authentication.user.country;
        if(country === 'gl') country = 'uk';
        if(country === 'at') country = 'de';

        const termsdata = require('./terms.data.json');
        return termsdata[country];
    }

}