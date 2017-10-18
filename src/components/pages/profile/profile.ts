import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Sidebar from './sidebar/sidebar';

import './profile.scss';

@Component({
    template: require('./profile.tpl.html'),
     components: {
        tsidebar: Sidebar,
    }
})
export default class Profile extends Vue {

}