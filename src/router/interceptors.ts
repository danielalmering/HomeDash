import Router, { Route, Location } from 'vue-router';
import store from '../store';

export function countryInterceptor(to: Route, from: Route, next: (to?: string | Location) => void){
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
        if(currentCountry) {
            store.dispatch('setCountry', currentCountry);
        }

        next();
    }
}

export function authenticatedInterceptor(to: Route, from: Route, next: (to?: string | Location) => void){

    let routed = false;

    if(store.state.authentication.user === undefined){
        //Wait for the authenticated user to be loaded
        store.watch((state) => {
            return state.authentication.user;
        }, (newValue, oldValue) => {
            if(!routed){
                routed = true;

                continueRouting();
            }
        });
    } else {
        continueRouting();
    }

    function continueRouting (){
        if(!store.getters.isLoggedIn){
            //TODO: Show unauthenticated error message
            store.dispatch('openMessage', {
                class: 'error',
                content: 'Error not logged in lalalala'
            });

            next({ path: '/' });
        } else {
            next();
        }
    }
}

export function safeInterceptor(to: Route, from: Route, next: (to?: string | Location) => void){
    if(to.query.safe !== undefined){
        store.commit('activateSafeMode');
    }

    next();
}