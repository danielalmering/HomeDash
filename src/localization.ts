import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { Location } from 'vue-router';
import router from './router';

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

//Add country to path in strict country mode
Object.defineProperty(Vue.prototype, '$localize', {
    get() {
        return (location: Location) => {
            const country = this.$route.params.country;

            if(!country){
                return location;
            }

            const route = router.resolve(location);
            const newLocation = Object.assign({}, route.location);

            if(newLocation.path && !newLocation.path.startsWith(country)){
                newLocation.path = `/${country}${newLocation.path}`;
                delete newLocation.name;
            }

            return newLocation;
        }
    }
});

export default i18n;