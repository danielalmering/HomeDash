// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';

import store from './store';
import router from './router';
import i18n from './localization';
import Vuelidate from 'vuelidate';

import App from './app';
import * as Sentry from '@sentry/browser';
import * as Integrations from '@sentry/integrations';

//requiring the shim adds it to the build
//require('webrtc-adapter');
require('../static/adapter.js');
require('./directives/clickOutside');
require('./directives/scroll');

import './styles/main.scss';

Vue.config.productionTip = false;
Vue.use(Vuelidate);

/* eslint-disable no-new */
const app = new Vue({
    el: '#app',
    router,
    store,
    i18n,
    template: '<App/>',
    components: { App }
});

import { currencyFilter } from './filters/euro';
import { basicDateTime, shortDate } from './filters/date';

Vue.filter('currency', currencyFilter);
Vue.filter('date', basicDateTime);
Vue.filter('shortdate', shortDate);

// Sentry.init({
//     dsn: 'https://060e792bc5b24219a84ddafe55364605@sentry.io/1774566',
//     integrations: [new Integrations.Vue({Vue, attachProps: true})],
// })
