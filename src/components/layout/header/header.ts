import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Top from './top/top';
import Nav from './nav/nav';

import './header.scss';
import WithRender from './header.tpl.html';

@WithRender
@Component({
    components: {
        top: Top,
        tnav: Nav
    }
})
export default class Header extends Vue {
}