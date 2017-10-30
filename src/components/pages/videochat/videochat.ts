import Vue from 'vue';
import jsmpeg from 'jsmpeg';

import { Component, Prop } from 'vue-property-decorator';
import { State } from '../../../models/session';
import { SessionData } from '../../../store/Session';

import notificationSocket from '../../../socket';
import Chat from './chat/chat';

import './videochat.scss';

@Component({
    template: require('./videochat.tpl.html'),
    components: {
        chat: Chat
    }
})
export default class VideoChat extends Vue {

    //Data
    isEnding: boolean = false;
    chatMessages: any[] = [];
    
    player: any;
    intervalTimer: number;
    chatSocketRef: number;

    get performer(){
        return this.$store.state.session.activePerformer;
    }

    get displayName(){
        return this.$store.state.session.activeDisplayName;
    }

    mounted(){
        const self = this;

        if(this.$store.state.session.activeState !== State.Initializing){
            this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });

            return;
        }

        const sessionData = this.$store.state.session.activeSessionData;

        if(!sessionData){
            return;
        }

        const videoUrl = `wss://push02.thuis.nl/jsmpeg?stream=${sessionData.playStream}&token=${sessionData.wowza.split('?token=')[1]}&hash=5B9F45B17A77831EA6C5346464BD2`;
        const video = <HTMLCanvasElement>this.$el.getElementsByClassName('jsmpeg')[0];

        const player = new jsmpeg.Player(videoUrl, {
            canvas: video,
            protocols: 'videoJSMPEG',
            audio: true,
            streaming: true,
            pauseWhenHidden: false,
            disableGl: false,
            playingStateChange: function(val){
                if(val === true){
                    self.$store.dispatch('setActive');
                }
            }
        });

        this.player = player;

        this.$store.watch((state) => state.session.activeState, (newValue: State) => {
            if(newValue === State.Ending && !this.isEnding){
                //TODO: Show message
                this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });
            }
        });

        this.intervalTimer = setInterval(async () => {
            await fetch('https://www.thuis.nl/api/session/client_seen', { credentials: 'include' });
        }, 1000);

        this.chatSocketRef = notificationSocket.subscribe('msg', (content) => {
            this.chatMessages.push(content);
        });
    }

    close(){
        this.$router.push({ name: 'Profile', params: { id: this.$route.params.id } });
    }

    beforeDestroy(){
        this.isEnding = true;

        //Stop clientSeen event
        clearInterval(this.intervalTimer);

        //Send end API call and update state to ending
        this.$store.dispatch('end', 'PLAYER_END');
        
        notificationSocket.unsubscribe(this.chatSocketRef);

        if(!this.player)
            return;

        if(this.player.source)
            this.player.source.destroy();

        this.player.stop();
    }
}