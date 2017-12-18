import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './account.scss';
import WithRender from './account.tpl.html';

@WithRender
@Component
export default class Account extends Vue {

    get user(){
        return this.$store.state.authentication.user;
    }

}