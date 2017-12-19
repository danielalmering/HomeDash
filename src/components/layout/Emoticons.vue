<template>
    <div class="emoticons">
        <div class="container-fluid">
            <ul class="emoticons__cat">
                <li><a><i class="icon-people" v-on:click="toggleIcons(1)"></i></a></li>
                <li><a><i class="icon-nature" v-on:click="toggleIcons(2)"></i></a></li>
                <li><a><i class="icon-food" v-on:click="toggleIcons(3)"></i></a></li>
                <li><a><i class="icon-activity" v-on:click="toggleIcons(4)"></i></a></li>
                <li><a><i class="icon-travel" v-on:click="toggleIcons(5)"></i></a></li>
                <li><a><i class="icon-objects" v-on:click="toggleIcons(6)"></i></a></li>
                <li><a><i class="icon-symbols" v-on:click="toggleIcons(7)"></i></a></li>
                <li><a><i class="icon-flags" v-on:click="toggleIcons(8)"></i></a></li>
            </ul>
            <div class="emoticons__list">
                <i v-for="index in emoticons['cat-' + number]" :key='index' class="e1a-med" :class="'e1a-'+ index">
                </i>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import config from '../../config';

import emoticonData from './Emoticons.data.json'

export default {
    name: 'emoticons',
    data () {
        return {
            emoticons: emoticonData,
            number: 1
        };
    },
    methods: {
        toggleIcons: function(number){
            this.number = number;
        }
    }
};
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
            i { color: $pallete-2; }

            &:hover, .active {
                i { color: $pallete-3; }
            }
        }
    }

    &__list {
        height: 200px;
        overflow: auto;
        @include rem(margin, 10px 0px);
    }
}

</style>
