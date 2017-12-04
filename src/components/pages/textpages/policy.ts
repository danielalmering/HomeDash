import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './textpages.scss';

@Component({
    template: require('./policy.tpl.html')
})
export default class Policy extends Vue {

}