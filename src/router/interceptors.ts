import Router, { Route, Location } from 'vue-router';
import store from '../store';
import { setCanonical } from '../seo';
import config from '../config';

export async function countryInterceptor(to: Route, from: Route, next: (to?: string | Location) => void){
    const acceptedCountries = ['uk', 'nl', 'de', 'gl'];
    let currentCountry;

    if(config.AutomaticCountryRedirect){
        let country = store.state.localization.country;

        console.log('<Country> store: ', country);

        if(!country){
            country = to.params.country ? to.params.country : from.params.country;
        }

        currentCountry = country;
    }

    if(currentCountry && acceptedCountries.indexOf(currentCountry) === -1){
        const newParams = to.params;

        if(to.name === 'Performers'){
            newParams.category = newParams.country;
        }

        delete newParams.country;

        next({ name: to.name, params: newParams, query: to.query });
    } else {
        if(currentCountry) {
            await store.dispatch('setCountry', currentCountry);
        }

        if(config.AutomaticCountryRedirect && to.params.country !== currentCountry && currentCountry !== 'gl'){
            const newParams = to.params;
            newParams.country = currentCountry;

            next({ name: to.name, params: newParams, query: to.query });
        } else {
            next();
        }
    }
}

export function waitAuthenticated(authenticatedRequired: boolean, next: (to?: string | Location) => void){
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
        if(!store.getters.isLoggedIn && authenticatedRequired){

            store.dispatch('openMessage', {
                class: 'error',
                content: 'auth.alerts.errorNotLoggedin'
            });

            next({ path: '/' });
        } else {
            next();
        }
    }
}

export function authenticatedInterceptor(to: Route, from: Route, next: (to?: string | Location) => void){
    return waitAuthenticated(true, next);
}

export async function preloadUserInterceptor(to: Route, from: Route, next: (to?: string | Location) => void){
    if(to.params.country && !store.state.localization.country){
        await store.dispatch('setCountry', to.params.country);
    }

    return waitAuthenticated(false, next);
}

export function safeInterceptor(to: Route, from: Route, next: (to?: string | Location) => void){
    if(to.query.safe !== undefined){
        store.commit('activateSafeMode');
    }

    next();
}

export function modalInterceptor(modalName: string, delayed: boolean = false) {
    return async (to: Route, previous: Route, next: any) => {
        await store.dispatch('displayModal', modalName);

        next();
    };
}

export async function confirmInterceptor(to: Route, previous: Route, next: (to?: string | Location) => void){
    try {
        await store.dispatch('confirmAccount', {
            userId: to.params.userId,
            token: to.params.token
        });

        store.dispatch('successMessage', 'confirm.successMessage');
    } catch(ex) {
        const errors: { [key: string]: string } = {
            'Account is already validated.': 'confirm.errorAlreadyActivated'
        };

        store.dispatch('errorMessage', errors[ex.message] || 'confirm.errorMessage');
    }

    next({
        name: 'Performers'
    });
}

export function seoInterceptor(to: Route, previous: Route){
    setCanonical(to.fullPath);
}