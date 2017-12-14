<template>
    <div id="app">
        <modal-wrapper></modal-wrapper>
        <cookies v-if="displayCookies" v-on:close="displayCookies = false"></cookies>
        <router-view/>
        <alerts></alerts>
    </div>
</template>

<script language="ts">
import modalWrapper from './components/modal/modal-wrapper';
import notificationSocket from './socket';
import alerts from './components/layout/Alerts';
import cookies from './components/layout/Cookies';

import config from './config';

export default {
    components: {
        modalWrapper: modalWrapper,
        alerts: alerts,
        cookies: cookies
    },
    data: function(){
        return {
            displayCookies: true
        };
    },
    name: 'app',
    created: function(){
        this.$store.dispatch('getSession').then(() => {
            notificationSocket.connect();
        });

        this.$store.dispatch('loadInfo');

        // this.$store.dispatch('openMessage', {
        //     content: 'Welkom op het nieuwe thuis',
        //     translate: false
        // });

        const cookiesAccepted = localStorage.getItem(`${config.StorageKey}.cookiesAccepted`);

        this.displayCookies = !(cookiesAccepted && cookiesAccepted === 'true');
    }
};
</script>

