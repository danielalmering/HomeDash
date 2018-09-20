// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import VeeValidate from 'vee-validate';

import store from './store';
import router from './router';
import i18n from './localization';

import App from './App.vue';

import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';

//requiring the shim adds it to the build
require('webrtc-adapter');
require('./directives/clickOutside');
require('./directives/scroll');

import './styles/main.scss';

Vue.use(VeeValidate);

Vue.config.productionTip = false;

/* eslint-disable no-new */
const app = new Vue({
    el: '#app',
    router,
    store,
    i18n,
    template: '<App/>',
    components: { App }
});

import { euroFilter } from './filters/euro';
import { basicDateTime } from './filters/date';

Vue.filter('euro', euroFilter);
Vue.filter('date', basicDateTime);

// Raven
//     .config('https://41ba31c21ec141c0b5bbcb50e6083f00@sentry.io/268247')
//     .addPlugin(RavenVue, Vue)
//     .install();