import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './profile.scss';


@Component({
    template: require('./profile.tpl.html'),
})
export default class Performer extends Vue {

}