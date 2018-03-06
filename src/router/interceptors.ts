import Router, { Route, Location } from 'vue-router';
import store from '../store';
import { setCanonical, setTitle, setDescription } from '../seo';
import config from '../config';
import Page from '../components/pages/page';
import i18n from '../localization';

export async function countryInterceptor(to: Route, from: Route, next: (to?: string | Location) => void){
    const acceptedCountries = ['uk', 'nl', 'de', 'gl', 'at'];
    let currentCountry;

    if(config.AutomaticCountryRedirect){
        let country = store.state.localization.country;

        if(!country){
            country = to.params.country ? to.params.country : from.params.country;
        }

        currentCountry = country;
    }

    if(to.params.country && acceptedCountries.indexOf(to.params.country) === -1){
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
    if(to.params.country && !store.state.localization.country && config.AutomaticCountryRedirect){
        await store.dispatch('setCountry', to.params.country);
    } else if(!store.state.localization.country && config.AutomaticCountryRedirect) {
        const locationResult = await fetch(`${config.BaseUrl}/client/geo/location`);
        const locationData = await locationResult.json();

        await store.dispatch('setCountry', locationData.country);
    }

    return waitAuthenticated(false, next);
}

export function safeInterceptor(to: Route, from: Route, next: (to?: string | Location) => void){
    if(to.query.safe !== undefined){
        store.commit('activateSafeMode');
    } else {
        store.commit('deactivateSafeMode');
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

    if(to.meta.title){
        setTitle(i18n.t(to.meta.title).toString());
    }

    if(to.meta.description){
        setDescription(i18n.t(to.meta.title).toString());
    }
}

export function hotjarInterceptor(to: Route, previous: Route, next: (to?: string | Location) => void){
    if(window.hj){
        window.hj('stateChange', to.fullPath);
    }

    next();
}

export function scrollInterceptor(to: Route, from: Route){

    let supportPageOffset = window.pageXOffset !== undefined;
    let isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
    const scrollTop = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
    
    if(from.name === 'Performers' && to.name === 'Profile'){
        store.commit('setPagePosition', scrollTop);
    }

    if(from.name === 'Profile' && to.name === 'Performers'){
        setTimeout(function() { 
            window.scrollTo(0, store.state.pagePosition);
            store.commit('setPagePosition', 0);
        },500)

        return;
    }

    setTimeout(function() { 
        window.scrollTo(0, 0);
    },500)

}
