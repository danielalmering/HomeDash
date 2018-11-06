import { Component, Prop } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import './landingpages.scss';

import config from '../../../config';
import WithRender from './landingpages.tpl.html';
import { listPerformers } from 'sensejs/performer';
import { Performer } from 'sensejs/performer/performer.model';

export const pages = require(`./pages.json`);

@WithRender
@Component
export default class Landingpage extends Vue {

    page: any;
    country = config.Country;

    get image(){
        return (size: string) => {
            const calsize = (size === 'xs') ? 'xs' : 'md';
            return require('../../../assets/images/' + this.country + '/landingspage-' + calsize + '.png');
        }
    }

    mounted(){
        this.page = (this.$route.params.landingpage === pages[this.country]) ? this.$route.params.landingpage : this.$router.push({name: 'Performers'});
    }
}