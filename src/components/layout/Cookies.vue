<template>
    <div class="cookies">
        <div class="container">
            <p class="cookies__text col-md-8" v-t="'footer.cookies'"></p>

            <div class="col-md-4">
                <button v-on:click="acceptCookie" class="btn btn-green">{{ $t('footer.cookiesAccept') }}</button>
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
    bottom: 0;
    left: 0;
    width: 100%;

    background-color: $pallete-11;
    height: 50px;

    &__text {
        color: $pallete-2;
    }
}

</style>
