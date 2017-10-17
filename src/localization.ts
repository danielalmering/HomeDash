import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

const messages = {
    en: require('./assets/localization/en.json'),
    de: require('./assets/localization/de.json'),
    nl: require('./assets/localization/nl.json')
};

const i18n = new VueI18n({
    locale: 'en',
    messages,
});

export default i18n;