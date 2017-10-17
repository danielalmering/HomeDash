import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './modal-login.scss';

@Component({
    template: require('./modal-login.tpl.html')
})
export default class ModalLogin extends Vue {

}