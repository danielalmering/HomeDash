import Vue from 'vue';
import config from '../../../config';

import { Component } from 'vue-property-decorator';

import './cookies.scss';
import WithRender from './cookies.tpl.html';

@WithRender
@Component
export default class Cookies extends Vue {

    acceptCookies(){
        if(localStorage) {
            localStorage.setItem(`${config.StorageKey}.cookiesAccepted`, 'true');
        }

        this.$emit('close');
    }
}