import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Header from '../layout/header/header';
import Footer from '../layout/footer/footer';

import './page.scss';


@Component({
    template: require('./page.tpl.html'),
    components: {
        theader: Header,
        tfooter: Footer
    }
})
export default class Page extends Vue {
}