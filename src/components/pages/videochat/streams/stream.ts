import Vue from 'vue';
import { Prop } from 'vue-property-decorator';

export default class Stream extends Vue {

    @Prop({
        type: String,
        required: true
    })
    playStream: string;

    @Prop({
        type: String,
        required: true
    })
    wowza: string;

    public onStateChange(value: string){
        this.$emit('stateChange', value);
    }

    public onError(message: string){
        this.$emit('error', message);
    }
}