import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './textpages.scss';
import WithRender from './policy.tpl.html';

@WithRender
@Component
export default class Policy extends Vue {

}