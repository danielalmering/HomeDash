<template>
    <div class="countryselection-wrapper">

        <div class="modal">
            <div class="modal__title"><i class="fa fa-globe"></i><span v-t="'modals.countryselect.title'"></span></div>
            <div class="modal__close" v-on:click="close"><i class="fa fa-times"></i></div>
            <div class="modal__content countryselect">
                <p v-t="'modals.countryselect.desc'"></p>
                <ul v-if="info">
                    <li v-for="country in info.countries" :key="country" :class="{ 'active': country === geo.country }" v-on:click="setCountry(country)">
                        <i :class="`flag flag-${country}`"></i> <b v-t="`modals.countryselect.country-${country}`"></b> 
                        <span v-if="country === 'nl'" v-t="'modals.countryselect.defaultcountry'"></span>
                    </li>
                </ul>
            </div>
        </div>

    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import config from '../../config';

import { Component, Prop } from 'vue-property-decorator';

@Component
export default class Countryselection extends Vue {

    geo: any = {country: '', ip: ''};

    get info(){
        return this.$store.state.info;
    }

    mounted(){
        this.getGeo();
    }

    async getGeo(){
        const geoResult = await fetch(`${config.BaseUrl}/client/geo/location`, {
            credentials: 'include'
        });

        if(!geoResult.ok){
            return;
        }

        this.geo = await geoResult.json();
    }

    setCountry(country: string){
        localStorage.setItem(`${config.StorageKey}.defaultCountry`, country);

        this.$emit('close');

        if(country === 'gl'){
            location.reload();
        } else {
            location.replace(window.location.href + country);
        }
    }

    close(){
        this.$emit('close');
    }

}
</script>

<style scoped lang="scss">

// Imports

@import "../../styles/_mixins.scss";
@import "../../styles/_settings.scss";

.countryselection-wrapper{
    position: absolute;
    width: 100%;
    height: 100%;

    .modal {
        position: absolute;
        top: 25%;
        left: 50%;
        transform: translate(-50%, -44%) !important;
        min-width: 500px;
        max-width: 400px;
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        @include rem(padding, 20px 20px);
        border: 10px solid rgba(0, 0, 0, 0.8);
        box-shadow: 0px 0px 150px $pallete-1;
        color: $pallete-2;
        z-index: 4999;
        background: $pallete-1;
        outline: 9999px solid rgba(0,0,0,0.5);
        background: $pallete-1 url('../../assets/images/global.png') center center no-repeat;

        @include breakpoint(xs) {
            min-width: 300px;
        }

        &__title {
            color: $pallete-2;
            @include rem(font-size, 20px);

            i {
                color: $pallete-3;
                @include rem(padding, 0);
                @include rem(font-size, 20px);
                @include rem(margin-right, 10px);
            }
        }

        &__close {
            position: absolute;
            top: 0px;
            right: 0px;
            @include rem(padding, 15px);
            cursor: pointer;
            i {
                color: $pallete-3;
                @include rem(font-size, 20px);
                @include rem(margin, 0);
            }
        }

        &__content {
            @include rem(padding, 10px 0px);


            &.countryselect {
                ul {
                    list-style: none;
                    @include rem(padding, 0);
    
                    li {
                        @include rem(font-size, 16px);
                        cursor: pointer;
                        &.active { color: $pallete-3; }
                        &:hover { color: $pallete-14; }
                        span {
                            font-weight: 700;
                            @include rem(font-size, 13px);
                            color: $pallete-18;
                        }
                    }
    
                    .flag { height: 26px; @include rem(margin-right, 5px); }
                }
            }
        }
    }
}

</style>
