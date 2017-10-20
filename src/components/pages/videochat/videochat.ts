import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Chat from './chat/chat';

import './videochat.scss';

@Component({
    template: require('./videochat.tpl.html'),
    components: {
        chat: Chat
    }
})
export default class VideoChat extends Vue {

}