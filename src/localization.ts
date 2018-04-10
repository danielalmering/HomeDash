import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { Location } from 'vue-router';
import router from './router';
import config from './config';

Vue.use(VueI18n);

const messages = {
    en: require('./assets/localization/en.json'),
    de: require('./assets/localization/de.json'),
    nl: require('./assets/localization/nl.json')
};

const i18n = new VueI18n({
    locale: config.locale.DefaultLanguage, //Change to default
    messages,
});

export default i18n;