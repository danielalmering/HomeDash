import Vue from 'vue';
import config from '../../../config';

import { Component } from 'vue-property-decorator';

import './agecheck.scss';
import WithRender from './agecheck.tpl.html';

@WithRender
@Component
export default class Alerts extends Vue {

    country = config.Country;

    acceptAge(){
        if(window.localStorage){
            window.localStorage.setItem(`${config.StorageKey}.agecheck`, 'true');
        }

        this.$emit('close');
    }

    declineAge(){
        location.href = 'http://www.google.com';
    }
}