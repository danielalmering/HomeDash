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
import { getParameterByName } from './util';

import alerts from './components/layout/Alerts.vue';
import cookies from './components/layout/Cookies.vue';
import agecheck from './components/layout/Agecheck.vue';

import config from './config';
import Raven from 'raven-js';

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
    getParameterByName = getParameterByName;

    async created(){
        const utmMedium = this.getParameterByName('utm_medium');

        await this.$store.dispatch('getSession');

        if(!utmMedium || utmMedium.toLowerCase() !== 'advertising'){

            this.$store.dispatch('intervalChecksession');
            await this.$store.dispatch('setLanguage', config.locale.DefaultLanguage);
        }

        notificationSocket.subscribe('message', (data: SocketMessageEventArgs) => {
            this.$store.dispatch('successMessage', 'general.successNewMessage');
        });

        // Cookies
        const cookiesAccepted = localStorage.getItem(`${config.StorageKey}.cookiesAccepted`);
        this.displayCookies = !(cookiesAccepted && cookiesAccepted === 'true');

        // Agecheck
        const AgeCheckAccepted = localStorage.getItem(`${config.StorageKey}.agecheck`);
        this.displayAgecheck = !config.locale.AgeCheck ? false : !(AgeCheckAccepted && AgeCheckAccepted === 'true');

        let registrationAttempts = 0;

        //  Hotjar
        const HotjarAccepted = config.locale.Hotjar ? registerHotjarToSentry() : '';

        function registerHotjarToSentry(){
            const hj = window.hj as any;
            registrationAttempts += 1;

            if(Raven.isSetup() && hj && hj.pageVisit && hj.pageVisit.property && hj.pageVisit.property.key){
                const hotjarUserId = hj.pageVisit.property.key;

                Raven.captureBreadcrumb({
                    message: `Sentry session started with hotjar user ${hotjarUserId}`,
                    category: 'data'
                });
            } else if(registrationAttempts <= 5) {
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
