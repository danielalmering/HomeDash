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

    chatMessage: string = '';
    chatMessages: ChatMessage[] = [];
    newMessage: boolean = false;
    chatSmall: boolean = false;
    isPerformerTyping: boolean = false;

    chatSocketRef: number;
    chatSocketTyping: number;

    mounted(){
        let typingTimeoutRef: number = 0;

        this.chatSocketRef = notificationSocket.subscribe('msg', (content: ChatMessage) => {
            content.message = content.message.replace(/:\w+:/g, (w) => {
                return `<i class="e1a-med e1a-${w.substring(1, w.length - 1)}"></i>`;
            });

            this.chatMessages.push(content);

            const chatContainer = this.$el.querySelector('.videochat__chat-list');

            if(!chatContainer) return;

            this.$nextTick(() => chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight);

            this.setNotifier(content.senderType);
        });

        this.chatSocketTyping = notificationSocket.subscribe('typing_received', (content: TypingReceivedMessage) => {
            this.isPerformerTyping = content.recentTyping || content.inBuffer;
        
            if(typingTimeoutRef){
                window.clearTimeout(typingTimeoutRef);
            }
        
            typingTimeoutRef = window.setTimeout(() => this.isPerformerTyping = false, 3000);
        });
    }

    setNotifier(sender: string){
        this.newMessage = (sender === 'ROLE_CLIENT') ? false : true;

        setTimeout(() => {
            this.newMessage = false;
        }, 2000);
    }

    beforeDestroy(){
        notificationSocket.unsubscribe(this.chatSocketRef);
        notificationSocket.unsubscribe(this.chatSocketTyping);
    }

    setFocus(selected: boolean){
        if((window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) > 480){
            return;
        }

        const screen = document.getElementsByClassName('videochat__screen-object') as any;

        if(selected){
            this.chatSmall = true;
            screen[0].style.top = 'auto';
            screen[0].style.bottom = 125 + 'px';
        } else {
            this.chatSmall = false;
            screen[0].style.top = 0 + 'px';
            screen[0].style.bottom = 'auto';
            this.chatSmall = false;
        }
    }

    sendMessage(){
        const santizedChatMessage = this.encodeHTML(this.chatMessage);

        notificationSocket.sendCustomEvent('msg', {
            message: santizedChatMessage,
            receiverId: this.$store.state.session.activePerformer.id,
            recceiverType: 'ROLE_PERFORMER'
        });

        this.chatMessage = '';
    }

    emojiSelected(name: string){
        this.chatMessage += `:${name}:`;

        const inputElement = this.$el.getElementsByClassName('searching')[0] as HTMLElement;
        inputElement.focus();

        this.smiliesOpened = false;
    }

    encodeHTML(s: string) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }
}