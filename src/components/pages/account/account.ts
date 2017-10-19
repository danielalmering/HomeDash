import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './account.scss';

@Component({
    template: require('./account.tpl.html')
})
export default class Account extends Vue {
}