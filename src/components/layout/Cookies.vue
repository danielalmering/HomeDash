<template>
    <div class="cookies">
        <div class="container-fluid">
            <div class="cookies__text">
                <p v-t="'footer.cookies'"></p>
            </div>
            <div class="cookies__btn">
                <a v-on:click="acceptCookie" class="btn btn-green btn-full">{{ $t('footer.cookiesAccept') }}</a>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import config from '../../config';

export default {
    name: 'alerts',
    data () {
        return {
        };
    },
    methods: {
        acceptCookie: function(){
            localStorage.setItem(`${config.StorageKey}.cookiesAccepted`, 'true');

            this.$emit('close');
        }
    }
};
</script>

<style scoped lang="scss">

// Imports

@import "../../styles/_mixins.scss";
@import "../../styles/_settings.scss";

.cookies {
    position: fixed;
    display: table;
    bottom: 0;
    left: 0;
    width: 100%;
    @include rem(padding, 0px 10px);

    background-color: $pallete-11;

    &__text {
        display: table-cell;
        width: 70%;
        color: $pallete-2;
        @include rem(padding, 5px 10px);

        @include breakpoint(xs) {
            display: table;
            width: 100%;
            @include rem(padding, 5px 10px 0px 10px);
        }
    }

    &__btn {
        display: table-cell;
        width: 30%;
        vertical-align: middle;
        @include rem(padding, 5px 10px);

        @include breakpoint(xs) {
            display: table;
            width: 100%;
            @include rem(padding, 0px 10px 5px 10px);
        }

        .btn {
            display: table;
            @include rem(margin, 0 auto);
            max-width: 250px;
        }
    }
}

</style>
