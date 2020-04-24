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

    get vidElement(){
        return (video: string) => {
            if(window.innerWidth >= 783){
                return `<video controls><source src="${config.FullApiUrl}/${config.VodServer}/${video}" type="video/mp4"></video>`;
            } else {
                return `<video controls muted><source src="${config.FullApiUrl}/${config.VodServer}/${video}" type="video/mp4"></video>`;
            }
        };
    }

    created() {
        this.videoElement = this.vidElement(this.videosrc);
    }

    @Watch('videosrc')
    oneChange(value: string, oldValue: string){
        this.videoElement = this.vidElement(value);
    }
}
