import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import notificationSocket from '../../../../socket';

import './chat.scss';

@Component({
    template: require('./chat.tpl.html')
})
export default class Chat extends Vue {

    chatMessage: string = '';

    sendMessage(){
        notificationSocket.sendCustomEvent('msg', {
            message: this.chatMessage,
            receiverId: this.$store.state.session.activePerformer.id,
            recceiverType: 'ROLE_PERFORMER'
        });

        this.chatMessage = '';
    }
}