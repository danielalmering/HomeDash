import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './Header.scss';

@Component({
    template: require('./Header.tpl.html')
})
export default class Header extends Vue {

    get language(){
        return this.$store.state.localization.language;
    }

    prop: string = 'Value';

    mounted(){
        this.prop = 'UpdatedValue';
    }
}