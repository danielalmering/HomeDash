import Router, { Route, Location } from 'vue-router';
import store from '../store';
import { setCanonical, setTitle, setDescription } from '../seo';
import config from '../config';
import Page from '../components/pages/page';
import i18n from '../localization';
import notificationSocket from '../socket';

export function socketInterceptor(to: Route, from: Route, next?: (to?: string | Location) => void){

    if(!store.state.authentication.user && !notificationSocket.isConnected() && from.name !== null){
        // Populate Userdata
        store.dispatch('getSession', false);
        // Start Checksession Polling
        store.dispatch('intervalChecksession'); // activate checksession
    }

    if(next){
        next();
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

export function userLoadedInterceptor(to: Route, from: Route, next: (to?: string | Location) => void){
    return waitAuthenticated(false, next);
}

export function modalInterceptor(modalName: string, delayed: boolean = false) {
    return async (to: Route, previous: Route, next: any) => {
        await store.dispatch('displayModal', {name: modalName});

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

        if(config.FreeRegister){
            window.location.href = '/payment';
        } else {
            next({
                name: 'Performers'
            });
        }

    } catch(ex) {
        const errors: { [key: string]: string } = {
            'Account is already validated.': 'confirm.errorAlreadyActivated'
        };

        store.dispatch('errorMessage', errors[ex.message] || 'confirm.errorMessage');
    }
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
    if(window.hj && config.locale.Hotjar){
        window.hj('stateChange', to.fullPath);
    }

    next();
}

export function scrollInterceptor(to: Route, from: Route){

    const supportPageOffset = window.pageXOffset !== undefined;
    const isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat');
    const scrollTop = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;

    if(from.name === 'Performers' && to.name === 'Profile'){
        store.commit('setPagePosition', scrollTop);
    }

    if(from.name === 'Profile' && to.name === 'Performers'){
        setTimeout(function() {
            window.scrollTo(0, store.state.pagePosition);
            store.commit('setPagePosition', 0);
        }, 500);

        return;
    }

    setTimeout(function() {
        window.scrollTo(0, 0);
    }, 500);

}
