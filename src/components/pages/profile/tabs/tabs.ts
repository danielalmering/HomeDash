import { Component, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import './tabs.scss';

@Component({
    template: require('./tabs.tpl.html'),
})
export default class Tabs extends Vue {

    selectedTab = '';

    startSession(){
        this.$emit('startSession');
    }
}