import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './nav.scss';

@Component({
    template: require('./nav.tpl.html')
})
export default class Nav extends Vue {
}