<template>
    <div class="confirmations">

        <div class="confirmations__content" v-if="type === 'loader'">
            <h2>{{ $t('confirmations.connect') }}</h2>
            <img class="spinner" src="../../assets/images/spinner.gif" >
            <p>{{ $t('confirmations.connectdesc') }}</p>
            <a class="btn btn-large btn-full btn-black" v-on:click="cancel">{{ $t('confirmations.cancel') }}</a>
        </div>

        <div class="confirmations__content" v-if="type === 'dialog'">
            <h2>{{ $t(title) }}</h2>
            <p>{{ $t(subTitle) }}</p>
            <a class="btn btn-large btn-orange btn-full" v-on:click="accept">{{ $t('confirmations.accept') }}</a>
            <a class="btn btn-large btn-full btn-black" v-on:click="cancel">{{ $t('confirmations.cancel') }}</a>
        </div>

    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import config from '../../config';

import { Component, Prop } from 'vue-property-decorator';

@Component
export default class Confirmations extends Vue {

    @Prop({
        required: true,
        type: String
    })
    type: string;

    @Prop({
        required: false,
        type: String
    })
    title: string;

    @Prop({
        required: false,
        type: String
    })
    subTitle: string;

    accept(){
        this.$emit('accept');
    }

    cancel(){
        this.$emit('cancel');
    }
}
</script>

<style scoped lang="scss">

// Imports

@import "../../styles/_mixins.scss";
@import "../../styles/_settings.scss";

.confirmations {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: $pallete-11;
    z-index: 2;

    &__content {
        position: absolute;
        z-index: 3;
        top: 25%;
        left: 50%;
        transform: translate(-50%, -50%) !important;
        display: table;
        text-align: center;
        width: 300px;
        @include rem(padding, 15px);
        @include rem(margin, auto auto);
        margin-top: 25%;
        border: 10px solid $pallete-13;
        background: $pallete-9;
        @include border-radius(5px);

        h2 {
            @include rem(margin-top, 0);
            color: $pallete-3;
        }

        p {
            font-weight: 600;
            color: $pallete-20;
        }

        .spinner {
            width: 50%;
            margin: 0 auto;
        }
    }
}

</style>
