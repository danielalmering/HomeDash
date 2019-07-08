import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Header from '../layout/header/header';
import Footer from '../layout/footer/footer';
import WithRender from './page.tpl.html';

@WithRender
@Component({
    components: {
        theader: Header,
        tfooter: Footer
    }
})
export default class Page extends Vue {

    get modal(){
        return this.$store.getters.getModal;
    }

}
