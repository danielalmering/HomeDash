import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import { VideoCodec } from 'typertc';

export default class Stream extends Vue {

    @Prop({
        type: String,
        required: false
    })
    playStream: string;

    @Prop({
        required: false
    })
    playToken: string;

    @Prop({
        type: String,
        required: true
    })
    wowza: string;

    @Prop({
        type: Boolean,
        required: false
    })
    muted: boolean;

    @Prop() videoCodec: VideoCodec;

    @Prop({
        type: Boolean,
        required: false
    })
    isSwitching: boolean;

    public onStateChange(value: string){
        this.$emit('stateChange', value);
    }

    public onError(message: string){
        this.$emit('error', message);
    }
}
