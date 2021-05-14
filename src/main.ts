import Vue from 'vue';
import store from './store';
import App from './app';

import './styles/main.scss';

Vue.config.productionTip = false;


/* eslint-disable no-new */
const app = new Vue({
    el: '#app',
    store,
    template: '<App/>',
    components: { App }
});