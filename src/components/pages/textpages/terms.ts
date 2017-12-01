import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './textpages.scss';

@Component({
    template: require('./terms.tpl.html')
})
export default class Terms extends Vue {

}