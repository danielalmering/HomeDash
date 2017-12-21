<template>
    <div class="agecheck">
        <div class="container-fluid">
            <div class="agecheck__text">
                <p v-t="'footer.agecheck'"></p>
                <a v-on:click="acceptAge" class="btn btn-small btn-orange" v-t="'footer.olderthen'"></a>
                <p> {{ $t('footer.or') }} <a v-on:click="declineAge" v-t="'footer.leavewebsite'"></a></p>
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

    acceptAge(){
        window.localStorage.setItem(`${config.StorageKey}.agecheck`, 'true');

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

.agecheck {
    position: fixed;
    z-index: 1;
    bottom: 0px;
    right: 0px;
    width: 300px;
    @include rem(padding, 0px 10px);
    background-color: $pallete-9;
    @include border-radius(5px);

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
    }
}


</style>
