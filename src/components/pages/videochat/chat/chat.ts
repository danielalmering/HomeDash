import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import notificationSocket from '../../../../socket';
import Emoticons from '../../../layout/Emoticons.vue';

import './chat.scss';

interface ChatMessage {
    senderType: string;
    message: string;
}
import WithRender from './chat.tpl.html';

@WithRender
@Component({
    components: {
        emoticons: Emoticons
    },
    props: {
        performerName: {
            required: true,
            type: String
        },
        userName: {
            required: true,
            type: String
        }
    }
})
export default class Chat extends Vue {

    chatOpened: boolean = true;
    smiliesOpened: boolean = false;

    chatMessage: string = '';
    chatMessages: ChatMessage[] = [];

    chatSocketRef: number;

    mounted(){
        this.chatSocketRef = notificationSocket.subscribe('msg', (content) => {
            this.chatMessages.push(content);

            const chatContainer = this.$el.querySelector('.videochat__chat-list');

            if(!chatContainer) return;

            this.$nextTick(() => chatContainer.scrollTo(0, chatContainer.scrollHeight));
        });
    }

    beforeDestroy(){
        notificationSocket.unsubscribe(this.chatSocketRef);
    }

    sendMessage(){
        notificationSocket.sendCustomEvent('msg', {
            message: this.chatMessage,
            receiverId: this.$store.state.session.activePerformer.id,
            recceiverType: 'ROLE_PERFORMER'
        });

        this.chatMessage = '';
    }

    sendEmoticon(emoticon: string){
        this.chatMessage = emoticon;
    }
}