import Router from 'vue-router';
import store from '../store';

export function countryInterceptor(to: Router.Route, from: Router.Route, next: (to?: string | Router.Location) => void){
    const acceptedCountries = ['uk', 'nl', 'de'];
    const currentCountry = to.params.country;

    if(currentCountry && acceptedCountries.indexOf(currentCountry) === -1){
        console.log('Not an accepted language');

        const newParams = to.params;

        delete newParams.country;

        store.dispatch('setCountry', currentCountry);

        next({ name: to.name, params: newParams });
    } else {
        store.dispatch('setCountry', 'uk');

        next();
    }
}