import Router from 'vue-router';
import store from '../store';

export function countryInterceptor(to: Router.Route, from: Router.Route, next: (to?: string | Router.Location) => void){
    const acceptedCountries = ['uk', 'nl', 'de'];
    const currentCountry = to.params.country;

    if(currentCountry && acceptedCountries.indexOf(currentCountry) === -1){
        const newParams = to.params;

        if(to.name === 'Performers'){
            newParams.category = newParams.country;
        }

        delete newParams.country;

        next({ name: to.name, params: newParams });
    } else {
        console.log(to.params.category);

        if(currentCountry) {
            store.dispatch('setCountry', currentCountry);
        }

        next();
    }
}