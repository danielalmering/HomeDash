import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../config';

import './voyeur.scss';

@Component({
    template: require('./voyeur.tpl.html')
})
export default class Voyeur extends Vue {

    mounted(){

    }
}