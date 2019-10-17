<template>
    <div>
        <div class="overlay" v-if="country === 'dee'"></div>
        <div class="agecheck" :class="{ 'large': country === 'dee' }">
            <div class="container-fluid">
                <div class="agecheck__text">
                    <p v-t="'footer.agecheck'"></p>
                    <a v-on:click="acceptAge" class="btn btn-small btn-orange" v-t="'footer.olderthen'"></a>
                    <p> {{ $t('footer.or') }} <a v-on:click="declineAge" v-t="'footer.leavewebsite'"></a></p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import config from '../../config';

import { Component } from 'vue-property-decorator';

@Component
export default class Alerts extends Vue {

    country = config.Country;

    acceptAge(){
        if(window.localStorage){
            window.localStorage.setItem(`${config.StorageKey}.agecheck`, 'true');
        }

        this.$emit('close');
    }

    declineAge(){
        location.href = 'http://www.google.com';
    }
}
</script>

<style scoped lang="scss">

// Imports

@import "../../styles/_mixins.scss";
@import "../../styles/_settings.scss";

.overlay {
    position: fixed;
    z-index: 1;
    background-color: #000;
    height: 100vh;
    left: 0;
    top: 0;
    width: 100vw;
}

.agecheck {
    position: fixed;
    z-index: 2;
    bottom: 0px;
    right: 0px;
    width: 300px;
    @include rem(padding, 0px 10px);
    background-color: $pallete-9;
    @include border-radius(5px);


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

        &:before {
            content: "";
            position: absolute;
            display: block;
            z-index: 2;
            right: 0;
            bottom: 0;
            width: 91px;
            height: 84px;
            background: url('../../assets/images/agecheck.png') no-repeat bottom left transparent;
        }
    }

    &.large {
        top: 20%;
        width: 100%;
        .agecheck__text {
            width: 600px;
            @include rem(font-size, 13px);
            @include rem(margin, 0px auto);
            @include rem(padding, 20px);
            @include border-radius(5px);
            overflow: hidden;
            border: 4px solid $pallete-3;
            @include breakpoint(xs) {
                width: 320px;
            }

            .btn {
                @include rem(font-size, 16px);
                @include rem(padding, 15px 30px);
            }
        }
    }
}


</style>
