<template>
    <div class="slider__large" v-on:keyup.esc="close" v-on:keyup.left="previous" v-on:keyup.right="next" tabindex="-1">
        <ul class="slider__large-list">
            <li v-for="(photo, index) in photos" :key="photo.id" v-on:touchstart="onTouchStart" v-on:touchend="onTouchEnd" :class="{ 'current': index === currentSelected, 'next': index === currentSelected + 1, 'previous': index === currentSelected - 1 }">
                <img v-if="!photo.wowza_sync" :src="getSliderImages(performer, photo, '')" />
                <player v-if="photo.wowza_sync" :videosrc="photo.name"></player>
            </li>
        </ul>
        <div class="slider__large-left" v-if="!isFirst" v-on:click="previous">
            <span><i class="fa fa-chevron-left" aria-hidden="true"></i></span>
        </div>
        <div class="slider__large-right" v-if="!isLast" v-on:click="next">
            <span><i class="fa fa-chevron-right" aria-hidden="true"></i></span>
        </div>

        <div class="slider__large-close" v-on:click="close">
            <i class="fa fa-times" aria-hidden="true"></i>
        </div>
    </div>
</template>

<script lang="ts">
import Vue, { ComponentOptions } from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { PerformerAvatar } from 'sensejs/performer/performer.model';

import { getSliderImages } from '../../../../util';
import Player from './slider-player';

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
        setTimeout( ()=>this.$el.focus(), 1 );
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
</script>
