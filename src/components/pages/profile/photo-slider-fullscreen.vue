<template>
    <div class="slider__large" :class="{ 'visible': visible }">
        <ul class="slider__large-list">
            <li v-for="(photo, index) in photos" :key="photo.id" :class="{ 'current': index === currentSelected, 'next': index === currentSelected + 1, 'previous': index === currentSelected - 1 }">
                <img :src="`//img.thuis.nl/files/pimg/${performer}/${photo.name}`">
            </li>
        </ul>
        <div class="slider__large-left" v-if="currentSelected > 0" v-on:click="currentSelected -= 1">
            <span><i class="fa fa-chevron-left" aria-hidden="true"></i></span>
        </div>
        <div class="slider__large-right" v-if="currentSelected < photos.length - 1" v-on:click="currentSelected += 1">
            <span><i class="fa fa-chevron-right" aria-hidden="true"></i></span>
        </div>

        <div class="slider__large-close" v-on:click="close">
            <i class="fa fa-times" aria-hidden="true"></i>
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
