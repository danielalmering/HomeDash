import Vue from 'vue';
import { Component, Watch, Prop } from 'vue-property-decorator';
import config from '../../../../config';


@Component({
    template: '<div class="player"><video controls><source :src="url" type="video/mp4"></video></div>'
})
export default class Player extends Vue {

    @Prop({
        required: true,
        type: String
    })
    videosrc: string;
    private url: string;


    constructor(){
        super();

        this.url = `${config.FullApiUrl}/${config.VodServer}/${this.videosrc}`;
    }
}
