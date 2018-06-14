import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import i18n from '../../../localization';

import './textpages.scss';
import WithRender from './cookies.tpl.html';

@WithRender
@Component
export default class Cookies extends Vue {

    get cookies(){
        let country = this.$store.state.authentication.user.country;
        if(country === 'at') country = 'de';

        const cookiesdata = require('./cookies.data.json');
        return cookiesdata[country];
    }

}