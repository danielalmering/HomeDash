<template>
    <div id="app">
        <modal-wrapper></modal-wrapper>
        <cookies v-if="displayCookies" v-on:close="displayCookies = false"></cookies>
        <router-view/>
        <agecheck v-if="displayAgecheck" v-on:close="displayAgecheck = false"></agecheck>
        <alerts></alerts>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import modalWrapper from './components/modal/modal-wrapper';
import notificationSocket from './socket';
import { SocketMessageEventArgs } from './models/Socket';

import alerts from './components/layout/Alerts.vue';
import cookies from './components/layout/Cookies.vue';
import agecheck from './components/layout/Agecheck.vue';

import config from './config';

@Component({
    components: {
        modalWrapper: modalWrapper,
        alerts: alerts,
        cookies: cookies,
        agecheck: agecheck
    }
})
export default class Cookies extends Vue {
    displayCookies: boolean = false;
    displayAgecheck: boolean = false;

    async created(){
        await this.$store.dispatch('getSession');
        notificationSocket.connect();
        notificationSocket.subscribe('message', (data: SocketMessageEventArgs) => {
            console.log('New message');
            this.$store.dispatch('successMessage', 'general.successNewMessage');
        });

        this.$store.dispatch('loadInfo');

        setInterval(() => this.$store.dispatch('getSession'), 60 * 1000); //Update user data every minute

        // Cookies
        const cookiesAccepted = localStorage.getItem(`${config.StorageKey}.cookiesAccepted`);
        this.displayCookies = !(cookiesAccepted && cookiesAccepted === 'true');

        // Agecheck
        const AgeCheckAccepted = localStorage.getItem(`${config.StorageKey}.agecheck`);
        this.displayAgecheck = config.NoAgeCheckCountries.indexOf(this.$store.state.localization.country) > -1 ? false : !(AgeCheckAccepted && AgeCheckAccepted === 'true');
    }
}
</script>

