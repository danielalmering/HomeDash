import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './Page.scss';

@Component({
    template: require('./Page.tpl.html')
})
export default class Page extends Vue {
    
    prop: string = 'Value';

    mounted(){
        this.prop = 'UpdatedValue';
    }
}