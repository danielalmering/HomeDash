import Vue from 'vue';
import { Component, Watch, Prop } from 'vue-property-decorator';
import config from '../../../../config';


@Component({
    template: '<div class="player" :id="videosrc" v-html="videoElement"></div>'
})
export default class Player extends Vue {

    @Prop({
        required: true,
        type: String
    })
    videosrc: string;
    videoElement: string;

    created() {
        this.videoElement = '<video controls><source src="' + config.FullApiUrl + '/' + config.VodServer + '/' + this.videosrc + '" type="video/mp4"></video>';
    }   

    @Watch('videosrc')
    oneChange(value: string, oldValue: string){
        this.videoElement = '<video controls><source src="' + config.FullApiUrl + '/' + config.VodServer + '/' + value + '" type="video/mp4"></video>';
    }
}
