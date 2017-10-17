import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Header from './layout/Header';

import './Page.scss';

@Component({
    template: require('./Page.tpl.html'),
    components: {
        pageheader: Header
    }
})
export default class Page extends Vue {

    get language(){
        return this.$store.state.localization.language;
    }

    prop: string = 'Value';

    mounted(){
        this.prop = 'UpdatedValue';
    }
}