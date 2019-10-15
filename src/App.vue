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
import * as Sentry from '@sentry/browser'
import 'whatwg-fetch';

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

    mounted(){
        // SafeMode
        const safeMode = this.getParameterByName('safe');
        const gotsafe = safeMode ? this.$store.commit('activateSafeMode') : this.$store.commit('deactivateSafeMode');
    }

    async created(){
        const utmMedium = this.getParameterByName('utm_medium');

        await this.$store.dispatch('getSession', false);

        if(!utmMedium || utmMedium.toLowerCase() !== 'advertising'){

            this.$store.dispatch('intervalChecksession');
            await this.$store.dispatch('setLanguage', config.locale.DefaultLanguage);
        }

        notificationSocket.subscribe('message', (data: SocketMessageEventArgs) => {
            this.$store.dispatch('successMessage', 'general.successNewMessage');
        });

        // Geo Safe check
        const geoResult = await fetch(`${config.BaseUrl}/loc`, { credentials: 'include'});
        const geoLocations = ['DE', 'BE', 'NL', 'LU'];
        const result = await geoResult.json();

        if(geoResult.ok && geoLocations.indexOf(result.country_code) !== -1){
            this.$store.commit('deactivateSafeMode');
        }

        // Localstorage Health Check
        const lstorage = ['NS_ERROR_FILE_CORRUPTED', ]
        try {
            window.localStorage.setItem(`${config.StorageKey}.localStorage`, 'true');
            window.localStorage.removeItem(`${config.StorageKey}.localStorage`);
        } catch(e) {
            if(e.name.indexOf(lstorage) !== -1) {
                this.$store.dispatch('errorMessage', 'general.errorLocalstorage');
                localStorage.clear();
            }
        }

        // Cookies
        const cookiesAccepted = (localStorage.getItem(`${config.StorageKey}.cookiesAccepted`) !== null ) ? localStorage.getItem(`${config.StorageKey}.cookiesAccepted`) : false;
        this.displayCookies = !(cookiesAccepted && cookiesAccepted === 'true');

        // Agecheck
        const AgeCheckAccepted = (localStorage.getItem(`${config.StorageKey}.agecheck`) !== null ) ? localStorage.getItem(`${config.StorageKey}.agecheck`) : false;
        this.displayAgecheck = !config.locale.AgeCheck ? false : !(AgeCheckAccepted && AgeCheckAccepted === 'true');

        let registrationAttempts = 0;

        //  Hotjar
        const HotjarAccepted = config.locale.Hotjar ? registerHotjarToSentry() : '';

        function registerHotjarToSentry(){
            const hj = window.hj as any;
            registrationAttempts += 1;

            if(hj && hj.pageVisit && hj.pageVisit.property && hj.pageVisit.property.key){
                const hotjarUserId = hj.pageVisit.property.key;

                Sentry.addBreadcrumb({
                    message: `Sentry session started with hotjar user ${hotjarUserId}`,
                    category: 'data'
                });
            } else if(registrationAttempts <= 5) {
                setTimeout(registerHotjarToSentry, 2000);
            } else {
                Sentry.addBreadcrumb({
                    message: `Could not register hotjar`,
                    category: 'data'
                });
            }
        }
    }
}
</script>
