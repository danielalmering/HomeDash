import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './textpages.scss';
import WithRender from './terms.tpl.html';

@WithRender
@Component
export default class Terms extends Vue {

}