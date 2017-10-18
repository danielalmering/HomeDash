import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';


import './performers.scss';

@Component({
    template: require('./performers.tpl.html')
})
export default class Performers extends Vue {

}