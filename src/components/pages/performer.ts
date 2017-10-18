import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './performer.scss';


@Component({
    template: require('./performer.tpl.html'),
})
export default class Performer extends Vue {

}