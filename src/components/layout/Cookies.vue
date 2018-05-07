<template>
    <div class="cookies">
        <div class="container-fluid">
            <div class="cookies__text">
                <p class="cookies__text-link" v-html="$t('footer.cookies')"></p>
                <a v-on:click="acceptCookies" class="cookies__text-btn"></a>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import config from '../../config';

import { Component } from 'vue-property-decorator';

@Component
export default class Cookies extends Vue {

    acceptCookies(){
        localStorage.setItem(`${config.StorageKey}.cookiesAccepted`, 'true');

        this.$emit('close');
    }
}
</script>

<style lang="scss">

// Imports

@import "../../styles/_mixins.scss";
@import "../../styles/_settings.scss";

.cookies {
    display: table;
    bottom: 0;
    left: 0;
    width: 100%;
    @include rem(padding, 0px 10px);
    border-bottom: 3px solid $pallete-3;
    background-color: $pallete-9;

    &__text {
        position: relative;
        display: table;
        width: 100%;
        min-height: 50px;
        line-height: 150%;
        color: $pallete-2;
        text-align: left;
        @include rem(padding, 5px 30px 2px 0px);
        @include rem(font-size, 11px);

        &-link { 
            a { color: $pallete-2 !important; }
        }

        &-btn {
            position: absolute;
            right: 0px;
            top: 5px;
            color: $pallete-3;
            &:before{
                content: "\f00d";
                font: normal normal normal 33px/1 FontAwesome;
            }
        }
    }
}

</style>
