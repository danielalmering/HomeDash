<template>
    <div class="slider__large" :class="{ 'visible': visible }" v-on:keyup.left="previous" v-on:keyup.right="next" tabindex="-1">
        <ul class="slider__large-list">
            <li v-for="(photo, index) in photos" :key="photo.id" v-on:touchstart="onTouchStart" v-on:touchend="onTouchEnd" :class="{ 'current': index === currentSelected, 'next': index === currentSelected + 1, 'previous': index === currentSelected - 1 }">
                <img :src="`//img.thuis.nl/files/pimg/${performer}/${photo.name}`">
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

interface PhotoSliderFullscreen extends Vue {
    currentSelected: number;
    touchStart: number;

    previous: () => void;
    next: () => void;
}

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
            currentSelected: 1,
            touchStart: 0
        };
    },
    mounted: function(){

    },
    methods: {
        close(){
            this.$emit('update:visible', false);
        },
        onTouchStart(evt: TouchEvent){
            this.touchStart = evt.touches[0].pageX;
        },
        onTouchEnd(evt: TouchEvent){
            // console.log(evt.offsetX + ' ' + evt.clientX + ' ' + evt.screenX + ' ' + evt.movementX);

            const touchDifference = this.touchStart - evt.changedTouches[0].pageX;

            console.log('end: ', touchDifference);

            if(touchDifference > 75){
                this.next();
            } else if(touchDifference < -75){
                this.previous();
            }
        },
        next(){
            if((<any>this).isLast){
                return;
            }

            this.currentSelected += 1;
        },
        previous(){
            if((<any>this).isFirst){
                return;
            }

            this.currentSelected -= 1;
        }
    },
    watch: {
        displayPic: function(newValue: number){
            for(var i = 0; i < this.$props.photos.length; i++){
                if(this.$props.photos[i].id === newValue){
                    this.currentSelected = i;
                }
            }
        },
        visible: async function(newValue: boolean){
            const self = this;

            this.$nextTick().then(() => {
                if(newValue){
                    self.$el.focus();
                } else {
                    self.$el.blur();
                }
            });

        }
    },
    computed: {
        isLast: function(){
            return this.currentSelected === this.$props.photos.length - 1
        },
        isFirst: function(){
            return this.currentSelected === 0;
        }
    }
} as ComponentOptions<PhotoSliderFullscreen>
</script>
