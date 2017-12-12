import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Sidebar from './profile/sidebar/sidebar';
import Confirmations from '../layout/Confirmations.vue';

@Component({
    template: require('./performer.tpl.html'),
    components: {
        tsidebar: Sidebar,
        tconfirmations: Confirmations
    }
})
export default class Performer extends Vue {

    get displaySidebar(){
        return this.$store.state.displaySidebar;
    }

}