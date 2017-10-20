import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './chat.scss';

@Component({
    template: require('./chat.tpl.html'),
    components: {
    }
})
export default class Chat extends Vue {

}