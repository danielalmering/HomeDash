<template>
    <div id="app">
        <modal-wrapper></modal-wrapper>
        <cookies v-if="displayCookies" v-on:close="displayCookies = false"></cookies>
        <router-view/>
        <agecheck v-if="displayAgecheck" v-on:close="displayAgecheck = false"></agecheck>
        <alerts></alerts>
    </div>
</template>

<script language="ts">
import modalWrapper from './components/modal/modal-wrapper';
import notificationSocket from './socket';
import alerts from './components/layout/Alerts';
import cookies from './components/layout/Cookies';
import agecheck from './components/layout/Agecheck';

import config from './config';

export default {
    components: {
        modalWrapper: modalWrapper,
        alerts: alerts,
        cookies: cookies,
        agecheck: agecheck
    },
    data: function(){
        return {
            displayCookies: false,
            displayAgecheck: false
        };
    },
    name: 'app',
    created: async function(){
        await this.$store.dispatch('getSession');
        notificationSocket.connect();

        this.$store.dispatch('loadInfo');

        setInterval(() => this.$store.dispatch('getSession'), 60 * 1000); //Update user data every minute

        // Cookies
        const cookiesAccepted = localStorage.getItem(`${config.StorageKey}.cookiesAccepted`);
        this.displayCookies = !(cookiesAccepted && cookiesAccepted === 'true');

        // Agecheck
        const AgeCheckAccepted = localStorage.getItem(`${config.StorageKey}.agecheck`);
        this.displayAgecheck = config.NoAgeCheckCountries.indexOf(this.$store.state.localization.country) > -1 ? false : !(AgeCheckAccepted && AgeCheckAccepted === 'true');
    }
};
</script>

