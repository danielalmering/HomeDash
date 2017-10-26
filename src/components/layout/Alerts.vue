<template>
    <div class="alerts">
        <transition v-for="alert in alerts" :key="alert.id" name="slide-fade">
            <div class="alerts__alert alerts__alert-info">
                {{alert.content}}
            </div>
        </transition>
    </div>
</template>

<script>
import Vue from 'vue';

export default {
    name: 'alerts',
    data () {
        return {
        };
    },
    methods: {
        
    },
    computed: {
        alerts: function(){
            return this.$store.state.alerts.messages;
        }
    }
};
</script>

<style scoped lang="scss">

// Imports

@import "../../styles/_mixins.scss";
@import "../../styles/_settings.scss";

//Styles

.alerts {
    position: fixed;
    z-index: 999;
    right: 0;
    bottom: 0;
    @include rem(padding, 10px);

    &__alert {
        position: relative;
        right: 0px;
        background-color: $pallete-1;
        color: $pallete-2;
        animation: slideIn 0.8s ease-in;
        width: 220px;
        @include rem(margin-bottom, 10px);
        @include rem(padding, 10px);
        @include border-radius(5px);

        @keyframes slideIn {
            0%      { right: -230px;}
            100%    { right: 0px;}
        }

        &.slide-fade-leave-active {
            right: -230px;
            transition: all 0.8s ease-out;
        }

        &-success {
            border: 2px solid $pallete-12;
            &:before{
                color: $pallete-12;
                content: "\f00c";
                @include rem(font-size, 18px);
                font-family: FontAwesome;
                @include rem(margin-right, 5px);
            }
        }

        &-info {
            border: 2px solid $pallete-22;
            &:before{
                color: $pallete-22;
                content: "\f129";
                @include rem(font-size, 18px);
                font-family: FontAwesome;
                @include rem(margin-right, 5px);
            }
        }

        &-error {
            border: 2px solid $pallete-15;
            &:before{
                color: $pallete-15;
                content: "\f12a";
                @include rem(font-size, 18px);
                font-family: FontAwesome;
                @include rem(margin-right, 5px);
            }
        }

        &:last-child {
            margin: 0;
        }
    }

}
</style>
