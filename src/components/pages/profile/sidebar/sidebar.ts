import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './sidebar.scss';


@Component({
    template: require('./sidebar.tpl.html'),
})
export default class Sidebar extends Vue {

}