<template>
    <div class="emoticons">
        <div class="container-fluid">
            <ul class="emoticons__cat">
                <li v-for="cat in emoticonCategories" :key="cat">
                    <a><i :class="`icon-${cat}`" v-on:click="selectCategory(cat)"></i></a>
                </li>
            </ul>
            <div class="emoticons__list">
                <i v-for="index in emoticons[selectedCategory]" :key='index' class="e1a-med" :class="'e1a-'+ index" v-on:click="selectEmoji(index)">
                </i>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import config from '../../config';
import emoticonData from './Emoticons.data.json';

import { Component } from 'vue-property-decorator';

@Component
export default class Emoticons extends Vue {

    emoticons: { [key: string]: string } = emoticonData;
    emoticonCategories: string[] = [];

    selectedCategory: string = 'people';

    mounted(){
        this.emoticonCategories = Object.keys(this.emoticons);
    }

    selectCategory(category: string){
        this.selectedCategory = category;
    }

    selectEmoji(name: string){
        this.$emit('emojiSelected', name);
    }
}
</script>

<style scoped lang="scss">

// Imports

@import "../../styles/_mixins.scss";
@import "../../styles/_settings.scss";
@import "../../styles/_emoticons.scss";

.emoticons {
    display: table;
    bottom: 0;
    left: 0;
    width: 100%;
    @include rem(padding, 10px 0px);
    @include border-bottom-radius(5px);
    background-color: $pallete-9;

    &__cat {
        display: table;
        width: 100%;
        height: 40px;
        list-style: none;
        @include rem(padding, 5px);
        @include rem(margin, 0px);
        li {
            float: left;
            @include rem(font-size, 22px);
            @include rem(padding, 0px 4.5px);
            i { color: $pallete-2; cursor: pointer; }

            &:hover, .active {
                i { color: $pallete-3; }
            }
        }
    }

    &__list {
        height: 200px;
        overflow: auto;
        @include rem(margin, 10px 0px);
        i {
            cursor: pointer;
        }
    }
}

</style>
