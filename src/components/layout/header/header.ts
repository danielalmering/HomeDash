import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Top from './top/top';
import Nav from './nav/nav';

import './header.scss';

@Component({
    template: require('./header.tpl.html'),
    components: {
        top: Top,
        tnav: Nav
    }
})
export default class Header extends Vue {

    get language(){
        return this.$store.state.localization.language;
    }

    prop: string = 'Value';

    mounted(){
        this.prop = 'UpdatedValue';
    }
}