import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './payment.scss';

@Component({
    template: require('./payment.tpl.html')
})
export default class Payment extends Vue {

}