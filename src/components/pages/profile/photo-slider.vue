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

import { getSliderImage }  from '../../../util';

export default {
    name: 'photo-slider',
    props: {
        photos: {
            required: true,
            type: Array
        },
        performer: {
            required: true,
            type: Number
        }
    },

    data () {
        return {
            position: 0,
            moveInterval: undefined,
            previousTouch: 0
        };
    },
    mounted: function(){
        console.log(this.$props.photos);
    },
    methods: {
        getSliderImage: getSliderImage,
        move: function(toggle: boolean, speed?: number){
            var self = this;

            if(toggle && speed){
                this.$data.moveInterval = setInterval(function(){
                    if(self.$data.position >= 0 && speed > 0){
                        return;
                    }

                    const list = <HTMLElement>self.$el.children[0].lastChild;

                    if(self.photos.length === 0 || (self.$data.position - self.$el.offsetWidth < -(list.offsetLeft + list.offsetWidth) && speed < 0)){
                        return;
                    }

                    self.$data.position += speed;
                }, 10);
            } else {
                clearInterval(this.$data.moveInterval);
            }
        },
        onClick: function(photo: number){
            this.$emit('photoSelected', photo);
        },
        onTouchMove(evt: TouchEvent){

            if(this.previousTouch !== 0){
                const touchDifference = this.previousTouch - evt.changedTouches[0].pageX;

                const list = <HTMLElement>this.$el.children[0].lastChild;

                if(this.position + touchDifference >= 0 ||
                    this.photos.length === 0 ||
                    (this.$data.position + touchDifference) - this.$el.offsetWidth < -(list.offsetLeft + list.offsetWidth)){
                    return;
                }

                this.position += touchDifference;
            }

            this.previousTouch = evt.changedTouches[0].pageX;
        },
        onTouchEnd(evt: TouchEvent){
            this.previousTouch = 0;
        },
    },
    watch: {

    },
    computed: {

    }
};
</script>