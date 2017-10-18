import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Header from '../layout/header/header';
import Footer from '../layout/footer/footer';

@Component({
    template: require('./page.tpl.html'),
    components: {
        theader: Header,
        tfooter: Footer
    }
})
export default class Page extends Vue {

    get language(){
        return this.$store.state.localization.language;
    }

    prop: string = 'Value';

    mounted(){
        this.prop = 'UpdatedValue';
    }
}