import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Sidebar from './profile/sidebar/sidebar';
import Confirmations from '../layout/confirmations/confirmations';
import { Route } from 'vue-router/types/router';
import WithRender from './performer.tpl.html';

@WithRender
@Component({
    components: {
        tsidebar: Sidebar,
        tconfirmations: Confirmations
    }
})
export default class Performer extends Vue {

    get modal(){
        return this.$store.getters.getModal;
    }

    get displaySidebar(){
        return this.$store.state.displaySidebar;
    }
}