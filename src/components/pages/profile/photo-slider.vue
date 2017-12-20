<template>
    <div class="slider__small" v-on:touchmove="onTouchMove" v-on:touchend="onTouchEnd">
        <ul class="slider__small-list" :style="{ left: position + 'px' }">
            <li v-for="photo in photos" :key="photo.id" v-on:click="onClick(photo.id)" v-if="getSliderImage(performer, photo.name, 'medium')">
                <img :src="getSliderImage(performer, photo.name, 'medium')" />
            </li>
        </ul>
        <div class="slider__small-right" v-on:mouseenter="move(true, -2)" v-on:mouseleave="move(false)">
            <i class="fa fa-chevron-right" aria-hidden="true"></i>
        </div>
        <div class="slider__small-left" v-on:mouseenter="move(true, 2)" v-on:mouseleave="move(false)">
            <i class="fa fa-chevron-left" aria-hidden="true"></i>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Avatar } from '../../../models/Performer';

import { getSliderImage }  from '../../../util';

@Component
export default class PhotoSlider extends Vue {

    @Prop({
        required: true,
        type: Array
    })
    photos: Avatar[];

    @Prop({
        required: true,
        type: Number
    })
    performer: number;

    position: number = 0;
    moveInterval: number = 0;
    previousTouch: number = 0;

    getSliderImage = getSliderImage;

    move(toggle: boolean, speed?: number){
        if(toggle && speed){
            this.moveInterval = window.setInterval(() => {
                if(this.position >= 0 && speed > 0){
                    return;
                }

                const list = <HTMLElement>this.$el.children[0].lastChild;

                if(this.photos.length === 0 || (this.position - this.$el.offsetWidth < -(list.offsetLeft + list.offsetWidth) && speed < 0)){
                    return;
                }

                this.position += speed;
            }, 10);
        } else {
            clearInterval(this.moveInterval);
        }
    }

    onClick(photoId: number){
        this.$emit('photoSelected', photoId);
    }

    onTouchMove(evt: TouchEvent){

        if(this.previousTouch !== 0){
            const touchDifference = this.previousTouch - evt.changedTouches[0].pageX;

            const list = <HTMLElement>this.$el.children[0].lastChild;

            if(this.position + touchDifference >= 0 ||
                this.photos.length === 0 ||
                (this.position + touchDifference) - this.$el.offsetWidth < -(list.offsetLeft + list.offsetWidth)){
                return;
            }

            this.position += touchDifference;
        }

        this.previousTouch = evt.changedTouches[0].pageX;
    }

    onTouchEnd(evt: TouchEvent){
        this.previousTouch = 0;
    }
}
</script>