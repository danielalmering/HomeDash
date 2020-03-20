import Broadcast, {Quality} from './broadcast';
import { Watch, Component } from 'vue-property-decorator';

//import 'swfobject';
const swfobject = require('swfobject');

export interface Flash{
    getCameras(): [{name: string, selected: boolean}];
    setCamera( name: string ): void;
    getMicrophones(): [{name: string, selected: boolean}];
    setMicrophone( name: string): void;
    toggleMicrophone( on: boolean ): void;
    getQuality(): Quality;
    setQuality( value: Quality ): void;
}

@Component({
    template: '<div><div id="broadcastSWF"><p>{{ $t("videochat.flashchecktext") }}<br /><a href="//www.adobe.com/go/getflashplayer" target="_blank"><img alt="Get Adobe Flash player" src="//www.adobe.com/images/shared/download_buttons/get_flash_player.gif" /></a></p></div></div>',
})
export class Rtmp extends Broadcast{

    get flash(): Flash{
        return this.$el.querySelector('#broadcastSWF') as any;
    }

    @Watch('mic') onMicChanged(value: boolean | string, oldValue: boolean | string) {
        if (typeof value === 'boolean'){
            //a boolean turns the mic on or off..
            this.flash.toggleMicrophone(value);
        } else if (!value){
            //an empty string turns the mic off...
            this.flash.toggleMicrophone(false);
        } else {
            //a string sets the mic to that specific mic.
            this.flash.setMicrophone(value);
        }
    }

    @Watch('cam') onCamChanged(value: string, oldValue: string) {
        if (typeof value !== 'string'){
            return;
        }
        this.flash.setCamera(value);
    }

    @Watch('quality') onQualityChanged(value: Quality, oldValue: Quality){
        this.flash.setQuality(value);
    }

    mounted(){
        const attrs = {'name': 'swf', 'id': 'broadcastSWF'};
        const params = {
            wmode : 'transparent',
            allowFullScreen : false
        };

        this.listener = `broadcast${new Date().getTime()}`;

        const bla: any = window;
        bla[this.listener] = {
            onStateChange: this.onStateChange.bind(this),
            onError: this.onError.bind(this)
        };

        let wowza = this.wowza;
        if (this.publishToken){
            wowza = wowza.replace(/token=(.+)/i, `token=${this.publishToken}`);
        }

        const flashvars = {
            wowza,
            publishStream: this.publishStream,
            listener: this.listener
        };

        swfobject.embedSWF('/static/Publish.swf', 'broadcastSWF', '100%', '100%', '10.2.0', true, flashvars, params, attrs);
    }

    private listener: string;

    destroyed(){
        if (this.listener){
            const bla: any = window;
            delete bla[this.listener];
        }
    }

}
