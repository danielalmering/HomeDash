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
    
    chatSocketRef: number;
    chatSocketTyping: number;
    fontSize: number = 12;
    
    isPerformerTyping: boolean = false;
    lastTypingMessage: number = 0;

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

    resizeFont(size: string){
        const fonts = document.getElementsByClassName('videochat__chat-list') as any;
        if(fonts[0].classList.contains('medium')){
            fonts[0].classList.remove('medium');
            fonts[0].classList.add("large");
        } else if(fonts[0].classList.contains('large')){
            fonts[0].classList.remove('large');
        } else {
            fonts[0].classList.add("medium");
        }
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

    sendTypingMessage(inBuffer: boolean){
        notificationSocket.sendCustomEvent('event', {
            event: 'typing_received',
            receiverId: this.$store.state.session.activePerformer.id,
            receiverType: 'ROLE_PERFORMER',
            content: encodeURIComponent('{"recentTyping":true,"inBuffer":'+(inBuffer?'true':'false')+'}')
        });
    }

    setTyping(){
        var currentTime = (new Date()).getTime() / 1000;

        // protect against sending to many 'is typing' updates
        // @note the inBuffer boolean is not considered, so possibly the inBuffer status on
        //       the client side is incorrect
        if (currentTime - this.lastTypingMessage >= 3) {
            this.sendTypingMessage(this.chatMessage !== '');
            this.lastTypingMessage = currentTime;
        }
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