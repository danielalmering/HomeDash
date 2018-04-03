<template>
    <div id="app">
        <modal-wrapper></modal-wrapper>
        <cookies v-if="displayCookies" v-on:close="displayCookies = false"></cookies>
        <countryselection v-if="displayCountryselection" v-on:close="displayCountryselection = false"></countryselection>
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
import countryselection from './components/layout/Countryselection.vue';

import config from './config';
import Raven from 'raven-js';

@Component({
    components: {
        modalWrapper: modalWrapper,
        alerts: alerts,
        cookies: cookies,
        agecheck: agecheck,
        countryselection: countryselection
    }
})
export default class Cookies extends Vue {
    displayCookies: boolean = false;
    displayAgecheck: boolean = false;
    displayCountryselection: boolean = false;

    async created(){
        await this.$store.dispatch('getSession');
        notificationSocket.connect();
        notificationSocket.subscribe('message', (data: SocketMessageEventArgs) => {
            this.$store.dispatch('successMessage', 'general.successNewMessage');
        });

        setInterval(() => this.$store.dispatch('getSession'), 60 * 1000); //Update user data every minute

        // Cookies
        const cookiesAccepted = localStorage.getItem(`${config.StorageKey}.cookiesAccepted`);
        this.displayCookies = !(cookiesAccepted && cookiesAccepted === 'true');

        // Agecheck
        const AgeCheckAccepted = localStorage.getItem(`${config.StorageKey}.agecheck`);
        this.displayAgecheck = config.NoAgeCheckCountries.indexOf(this.$store.state.localization.country) > -1 ? false : !(AgeCheckAccepted && AgeCheckAccepted === 'true');

        // Country selection ( deactivated country select popup )
        // const defaultCountryselected = localStorage.getItem(`${config.StorageKey}.defaultCountry`);
        // this.displayCountryselection = (this.$store.state.localization.country === 'gl' && !defaultCountryselected);


        let registrationAttempts = 0;

        registerHotjarToSentry();

        function registerHotjarToSentry(){
            const hj = window.hj as any;
            registrationAttempts += 1;

            if(Raven.isSetup() && hj && hj.pageVisit && hj.pageVisit.property){
                const hotjarUserId = hj.pageVisit.property.get('userId');

                Raven.captureBreadcrumb({
                    message: `Sentry session started with hotjar user ${hotjarUserId}`,
                    category: 'data'
                });
            } else if(registrationAttempts < 5) {
                setTimeout(registerHotjarToSentry, 2000);
            } else {
                Raven.captureBreadcrumb({
                    message: `Could not register hotjar`,
                    category: 'data'
                });
            }
        }
    }
}
</script>

