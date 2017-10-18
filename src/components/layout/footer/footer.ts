import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './footer.scss';

@Component({
    template: require('./footer.tpl.html')
})
export default class Footer extends Vue {

}