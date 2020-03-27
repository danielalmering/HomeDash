import Vue, { ComponentOptions } from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { PerformerAvatar } from 'sensejs/performer/performer.model';

import { getSliderImages } from '../../../../../utils/main.util';
import Player from './../slider-player';

import WithRender from './slider-fullscreen.tpl.html';

@WithRender
@Component({
    components: {
        player: Player
    }
})
export default class SliderFullscreen extends Vue {

    getSliderImages = getSliderImages;

    mounted(){
        this.currentSelected = this.photos.findIndex(p => p.id === this.displayPic);
        //without the timeout, photos will flash through the screen
        setTimeout( ()=> (this.$el as HTMLElement).focus(), 1 );
    }

    @Prop({
        required: true,
        type: Array
    })
    photos: PerformerAvatar[];

    @Prop({
        required: true,
        type: Number
    })
    performer: number;

    @Prop({
        default: false,
        type: Boolean
    })
    visible: boolean;

    @Prop({
        required: true,
        type: Number
    })
    displayPic: number;

    touchStart: number = 0;

    getSliderImage = getSliderImages;

    currentSelected:number = 1;

    get isLast(){
        return this.currentSelected === this.$props.photos.length - 1
    }

    get isFirst(){
        return this.currentSelected === 0;
    }

    next(){
        if(this.isLast){
            return;
        }

        this.currentSelected += 1;
    }

    previous(){
        if(this.isFirst){
            return;
        }

        this.currentSelected -= 1;
    }

    close(){
        this.$emit('close');
    }

    onTouchStart(evt: TouchEvent){
        this.touchStart = evt.touches[0].pageX;
    }

    onTouchEnd(evt: TouchEvent){
        const touchDifference = this.touchStart - evt.changedTouches[0].pageX;

        if(touchDifference > 75){
            this.next();
        } else if(touchDifference < -75){
            this.previous();
        }
    }

}