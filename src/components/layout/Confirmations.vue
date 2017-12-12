<template>
    <div class="confirmations">

        <div class="confirmations__content" v-if="type === 'connect'">
            <h2>{{ $t('confirmations.connect') }}</h2>
            <img class="spinner" src="../../assets/images/spinner.gif" >
            <p>{{ $t('confirmations.connectdesc') }}</p>
            <a class="btn btn-large btn-full">{{ $t('confirmations.cancel') }}</a>
        </div>
        
        <div class="confirmations__content" v-if="type === 'disconnect'">
            <h2>{{ $t('confirmations.disconnect') }}</h2>
            <p>{{ $t('confirmations.disconnectdesc') }}</p>
            <a class="btn btn-large btn-orange btn-full">{{ $t('confirmations.accept') }}</a>
            <a class="btn btn-large btn-full">{{ $t('confirmations.cancel') }}</a>
        </div>

    </div>
</template>

<script>
import Vue from 'vue';
import config from '../../config';

export default {
    name: 'confirmations',
    props: {
        type: {
            required: true,
            type: String
        },
    },
    data () {

        return {
        };
    },
    methods: {
    }
};
</script>

<style scoped lang="scss">

// Imports

@import "../../styles/_mixins.scss";
@import "../../styles/_settings.scss";

.confirmations {
    position: fixed;
    z-index: 2;
    bottom: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: $pallete-11;

    &__content {
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
