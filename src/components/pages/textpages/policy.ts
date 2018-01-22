import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import i18n from '../../../localization';

import './textpages.scss';
import WithRender from './policy.tpl.html';

@WithRender
@Component
export default class Policy extends Vue {

    get policy(){
        let country = this.$store.state.authentication.user.country;
        if(country === 'gl') country = 'uk';
        if(country === 'at') country = 'de';

        const policydata = require('./policy.data.json');
        return policydata[country];
    }

}