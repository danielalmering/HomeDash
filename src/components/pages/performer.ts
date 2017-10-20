import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Sidebar from './profile/sidebar/sidebar';

@Component({
    template: require('./performer.tpl.html'),
    components: {
        tsidebar: Sidebar
    }
})
export default class Performer extends Vue {

}