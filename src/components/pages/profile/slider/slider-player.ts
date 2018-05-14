import Vue from 'vue';
import { Component, Watch, Prop } from 'vue-property-decorator';
import config from '../../../../config';

declare const NanoPlayer: any;

@Component({
    template: '<div class="nanocosmos" :id="id"></div>'
})
export default class NanoCosmos extends Vue {

    @Prop({
        required: true,
        type: String
    })
    videosrc: string;

    constructor(){
        super();

        this.id = Math.round( Math.random() * Date.now() ).toString(16);
    }

    private id: string;
    private player: any;

    mounted(){
       this.load();
    }

    private getH5WebSocket(): string {
        return `wss://${config.H5Server}:443/h5live/stream`;
    }

    private load(){
        this.player = new NanoPlayer(this.id);

        this.player

        const configH5LIVE = {
            'source': {
                'h5live': {
                    'server': {
                        'websocket': this.getH5WebSocket()
                    },
                    'rtmp': {
                        'url': `${config.VodServer}`,
                        'streamname': `mp4:${this.videosrc}`
                    }
                }
            },
            playback: {
                autoplay: false
            },
            style: {
                controls: true
            }
        };

        this.player.setup(configH5LIVE).then((s: any) => {
            //na da?
            console.log(s);
        }, function (error: any) {
            console.log(error.message);
        });
    }
}
