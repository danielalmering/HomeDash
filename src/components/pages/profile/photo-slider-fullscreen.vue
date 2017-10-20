<template>
    <div class="gallery-full" :class="{ 'visible': visible }">
        <ul class="">
            <li class="gallery-full__item" v-for="(photo, index) in photos" :key="photo.id" :class="{ 'current': index === currentSelected, 'next': index === currentSelected + 1, 'previous': index === currentSelected - 1 }">
                <img :src="`//img.thuis.nl/files/pimg/${performer}/${photo.name}`">
            </li>
        </ul>
        <div class="gallery-full__left" v-if="currentSelected > 0" v-on:click="currentSelected -= 1">
            <i class="fa fa-chevron-left" aria-hidden="true"></i>
        </div>
        <div class="gallery-full__right" v-if="currentSelected < photos.length - 1" v-on:click="currentSelected += 1">
            <i class="fa fa-chevron-right" aria-hidden="true"></i>
        </div>

        <div class="gallery-full__close" v-on:click="close">
            CLOSE BUTTON, STYLING = NIET MIJN WINKEL VRIEND
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default {
    name: 'photo-slider-fullscreen',
    props: {
        photos: {
            required: true,
            type: Array
        },
        performer: {
            required: true,
            type: Number
        },
        visible: {
            default: false,
            type: Boolean
        },
        displayPic: {
            required: false,
            type: Number
        }
    },

    data () {
        return {
            currentSelected: 1
        };
    },
    mounted: function(){

    },
    methods: {
        close(){
            this.$emit('update:visible', false);
        }
    },
    watch: {
        displayPic: function(newValue: number){
            for(var i = 0; i < this.photos.length; i++){
                if(this.photos[i].id === newValue){
                    this.currentSelected = i;
                }
            }
        }
    },
    computed: {

    }
};
</script>

<style lang="scss">
@import "../../../styles/_mixins.scss";
@import "../../../styles/_settings.scss";

.gallery-full {
    display: none;
    position: fixed;
    left: 0;
    top: 0;
    overflow: hidden;
    z-index: 1000;

    width: 100%;
    height: 100%;
    font-size:0;

    background-color: rgba(0,0,0,0.9);

    @include rem(padding, 0px);

    &__close {
        position: absolute;
        top: 0;
        right: 0;
        background-color: green;
        font-size: 24px;
    }

    &__right, &__left {
        position: absolute;
        display: table;
        top: 0px;
        right: 0px;
        height: 100%;
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
        position: absolute;
        list-style: none;
        height: 100%;
        width: 100%;
        display: none;

        transition: left 0.8s ease-in-out;

        img {
            display: block;
            margin: 0 auto;
            height: 100%;
        }
    }

    .current {
        display: list-item;
        left: 0;
    }

    .previous {
        display: list-item;
        left: -100%;
    }

    .next {
        display: list-item;
        left: 100%;
    }
}

.visible {
    display: block;
}
</style>