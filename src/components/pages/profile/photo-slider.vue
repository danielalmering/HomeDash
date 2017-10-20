<template>
    <div class="profile__footer-gallery">
        <ul class="gallery" :style="{ left: position + 'px' }">
            <li class="gallery__item" v-for="photo in photos" :key="photo.id" v-on:click="onClick(photo.id)">
                <img :src="`//img.thuis.nl/files/pimg/${performer}/medium/${photo.name}`">
            </li>
        </ul>
        <div class="gallery__right" v-on:mouseenter="move(true, -2)" v-on:mouseleave="move(false)">
            <i class="fa fa-chevron-right" aria-hidden="true"></i>
        </div>
        <div class="gallery__left" v-on:mouseenter="move(true, 2)" v-on:mouseleave="move(false)">
            <i class="fa fa-chevron-left" aria-hidden="true"></i>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

import FullSlider from './photo-slider-fullscreen';

export default {
    name: 'photo-slider',
    components: {
        photoSliderFull: FullSlider
    },
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
            moveInterval: undefined
        };
    },
    mounted: function(){
        console.log(this.$props.photos);
    },
    methods: {
        move: function(toggle: boolean, speed?: number){
            var self = this;

            if(toggle && speed){
                this.$data.moveInterval = setInterval(function(){
                    self.$data.position += speed;
                }, 10);
            } else {
                clearInterval(this.$data.moveInterval);
            }
        },
        onClick: function(photo: number){
            this.$emit('photoSelected', photo);
        }
    },
    watch: {

    },
    computed: {

    }
};
</script>

<style lang="scss">
@import "../../../styles/_mixins.scss";
@import "../../../styles/_settings.scss";

.gallery {
    display: block;
    position: absolute;
    left: calc(250px + -100px);
    overflow: hidden;

    width: 99999px;
    max-width: none;
    height: 300px;
    font-size:0;
    @include rem(padding, 0px);

    &__right, &__left {
        position: absolute;
        display: table;
        top: 0px;
        right: 0px;
        height: 300px;
        width: 50px;
        background-color: $pallete-11;
        text-align: center;
        cursor: pointer;

        i {
            @include rem(font-size,25px);
            display: table-cell;
            vertical-align: middle;
            color:$pallete-2;
        }
    }

    &__left {
        left: 0px;
    }

    li {
        float: left;
        width: 225px;
        list-style: none;
        img { width: 100%; }
    }
}
</style>