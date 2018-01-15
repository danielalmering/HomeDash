import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import notificationSocket from '../../../../socket';
import Emoticons from '../../../layout/Emoticons.vue';

import './chat.scss';

interface ChatMessage {
    senderType: string;
    message: string;
}
interface TypingReceivedMessage {
    recentTyping: boolean;
    inBuffer: boolean;
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

    typingTimer: number = 0;
    showTyping: boolean = false;

    chatMessage: string = '';
    chatMessages: ChatMessage[] = [];

    chatSocketRef: number;
    typingSocketRef: number;

    mounted(){
        this.chatSocketRef = notificationSocket.subscribe('msg', (content: ChatMessage) => {
            content.message = content.message.replace(/:\w+:/g, (w) => {
                return `<i class="e1a-med e1a-${w.substring(1, w.length - 1)}"></i>`;
            });

            this.chatMessages.push(content);

            const chatContainer = this.$el.querySelector('.videochat__chat-list');

            if(!chatContainer) return;

            this.$nextTick(() => chatContainer.scrollTo(0, chatContainer.scrollHeight));
        });
        this.typingSocketRef = notificationSocket.subscribe('typing_received', (content: TypingReceivedMessage) => {
            this.showTyping = content.recentTyping || content.inBuffer;

            if (this.typingTimer) {
                clearTimeout(this.typingTimer);
            }

            this.typingTimer = setTimeout(() => {
                this.showTyping = false;
            }, 5*1000);
        });
    }

    beforeDestroy(){
        notificationSocket.unsubscribe(this.typingSocketRef);
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

    emojiSelected(name: string){
        this.chatMessage += `:${name}:`;

        const inputElement = this.$el.getElementsByClassName('searching')[0] as HTMLElement;
        inputElement.focus();
    }
}
