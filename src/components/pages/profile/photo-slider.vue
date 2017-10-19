<template>
    <div class="profile__info-gallery">
        <ul class="gallery" :style="{ left: position + 'px' }">
            <li class="gallery__item" v-for="photo in photos" :key="photo.id">
                <img :src="`//img.thuis.nl/files/pimg/${performer}/medium/${photo.name}`">
            </li>
        </ul>
        <div class="gallery__right" v-on:mouseenter="move(true, 1)" v-on:mouseleave="move(false)">
            RIGHT
        </div>
        <div class="gallery__left" v-on:mouseenter="move(true, -1)" v-on:mouseleave="move(false)">
            LEFT
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

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
    display: flex;
    flex-direction: row;
    position: absolute;
    left: calc(250px + -100px);

    width: 100%;
    max-width: none;
    height: 300px;
    font-size:0;
    @include rem(padding, 0px);

    &__right {
        position: absolute;
        background-color: green;
    }

    &__left {
        position: absolute;
        top: 500px;
        background-color: green;
    }

    &.standard li {
        text-align: center;
        padding: 20px;
        font-size: 20px;
    }

    li {
        font-size:30px;
        position:relative;
        background-size: 100%;
        background-repeat: no-repeat;
        list-style: none;
        img { width: 100%; }
    }

    .debug {
        position: absolute;
        bottom: 0;
        height: 50px;
        background: rgba(0,0,0,0.7);
        color:white;
        font-size: 12px;
        width: 100%;
        padding: 5px;
    }
}
</style>