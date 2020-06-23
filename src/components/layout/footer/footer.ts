import { Component, Prop, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import Seo from './seo/seo';

import './footer.scss';
import WithRender from './footer.tpl.html';
import notificationSocket from '../../../socket';

@WithRender
@Component({
    components: {
        seo: Seo
    }
})
export default class Footer extends Vue {

    isSocketConnected: boolean = false;

    get branding(){
        return this.$store.getters.getBranding;
    }

    get fullYear(){
        return new Date().getFullYear();
    }

    created(){
        window.setInterval(() => { this.isSocketConnected = notificationSocket.isConnected(); }, 3000);
    }
}