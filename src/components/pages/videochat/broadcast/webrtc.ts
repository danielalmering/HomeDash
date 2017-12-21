import Broadcast, {Quality} from "./broadcast";
import { Watch, Component } from "vue-property-decorator";
import { WRTCUtils, Publisher } from "typertc";

@Component({
    template: '<video playsinline webkit-playsinline autoplay :cam="true" :mic="false"></video>'
})
export class WebRTC extends Broadcast{

    @Watch('mic') onMicChanged(value: boolean | string, oldValue: boolean | string) {
        console.log(`mic was ${oldValue} en is ${value}`)
        if (typeof value === 'boolean'){
            //a boolean turns the mic on or off..
            this.wrtc.toggleAudio(value);
        } else if (!value){
            //an empty string turns the mic off...
            this.wrtc.toggleAudio(false);
        } else {
            //a string sets the mic to that specific mic.
            this.wrtc.microphone = value;
        }
    }

    @Watch('cam') onCamChanged(value: string, oldValue: string) {
        console.log(`cam was ${oldValue} en is ${value}`)
        if (typeof value !== 'string'){
            return;
        }
        this.wrtc.camera = value;
    }

    @Watch('quality') onQualityChanged(value: Quality, oldValue: Quality){
        this.wrtc.quality = ["ld", "md", "hd"][value];
    }

    mounted(){
        console.log("modderdude, wrtc gemount!!");
        var wowzaParts = WRTCUtils.parseUrl(this.wowza);
        WRTCUtils.validate(wowzaParts);

        var options = {
            wowza: wowzaParts.host + "/webrtc-session.json",
            applicationName: wowzaParts.application,
            token: wowzaParts.parameters.token,
            streamName : this.publishStream,
            element: (this.$el as HTMLVideoElement) || undefined,
            useWebSockets: true,
            debug: false
        };

        this.wrtc = new Publisher( options );
        this.wrtc.onStateChange = this.onStateChange.bind(this);
        this.wrtc.onError = this.onError.bind(this); 
    }

    wrtc:Publisher;

    destroyed(){
        if( this.wrtc ){
            this.wrtc.stop()
        };
    }

}