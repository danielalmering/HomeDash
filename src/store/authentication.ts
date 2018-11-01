import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';
import { User, AnonymousUser, UserForm } from '../models/User';
import { updateConsumer } from 'sensejs/consumer';
import { Consumer } from 'sensejs/core/models/user';
import { transformReadConsumer } from 'sensejs/consumer/consumer.transformer';
import config from '../config';
import notificationSocket from '../socket';
import Raven from 'raven-js';
import { tagHotjar, getParameterByName } from '../util';
import router from '../router';

export interface AuthState {
    user: User | undefined;
}

export interface LoginPayload {
    email: string;
    password: string;
}

type AuthContext = ActionContext<AuthState, RootState>;

const authenticationStore: Module<AuthState, RootState> = {
    state: {
        user: undefined
    },
    getters: {
        isLoggedIn: state => {
            return state.user !== undefined && state.user.roles !== undefined && state.user.roles[0] === 'ROLE_CLIENT';
        },
        hasSession: state => {
            return state.user !== undefined;
        }
    },
    mutations: {
        setUser(state: AuthState, user: User | undefined){
            state.user = user;

            if(state.user !== undefined && Raven.isSetup()){
                Raven.setUserContext({
                    id: state.user.id.toString()
                });
            }

            tagHotjar(`USER_${user ? user.id : 'NONE'}`);
        }
    },
    actions: {
        async login(store: AuthContext, payload: LoginPayload){
            const loginResult = await fetch(`${config.BaseUrl}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(payload),
                headers: new Headers({
                    role: 'ROLE_CLIENT'
                })
            });

            const loginData: any = await loginResult.json();

            if(loginResult.ok){
                store.dispatch('openMessage', {
                    content: 'auth.alerts.successlogin',
                    class: 'success',
                    translateParams: {
                        username: loginData.username
                    }
                });
            } else {
                store.dispatch('openMessage', {
                    content: 'auth.alerts.errorlogin',
                    class: 'error'
                });

                if(loginData.url){
                    setTimeout(() => window.location.replace(loginData.url), 1000);
                }

                return;
            }

            store.commit('setUser', transformReadConsumer(loginData));

            notificationSocket.disconnect();
            notificationSocket.connect();
        },
        async logout(store: AuthContext){
            const logoutResult = await fetch(`${config.BaseUrl}/auth/logout`, {
                credentials: 'include'
            });

            await store.dispatch('getSession');

            notificationSocket.disconnect();
            notificationSocket.connect();
        },
        async register(store: AuthContext, payload: UserForm){
            const registerResult = await fetch(`${config.BaseUrl}/client/client_accounts`, {
                method: 'POST',
                credentials: 'include',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(payload)
            });

            if(!registerResult.ok){
                throw new Error('Registration failed');
            }
        },
        async confirmAccount(store: AuthContext, payload: { userId: number, token: string }){
            const confirmResult = await fetch(`${config.BaseUrl}/client/client_accounts/${payload.userId}/confirm/${payload.token}`, {
                credentials: 'include'
            });

            if(!confirmResult.ok){
                const data = await confirmResult.json();
                throw new Error(data.error);
            }
        },
        async getSession(store: AuthContext){
            const checkSessionResult = await fetch(`${config.BaseUrl}/check_session`, {
                credentials: 'include'
            });

            let sessionData: AnonymousUser | undefined = undefined;

            const utmMedium = getParameterByName('utm_medium');
            const utm = (utmMedium && utmMedium.toLowerCase() === 'advertising') ? true : false;
            const referer = utm ? `&referer=${router.currentRoute.query.utm_source}` : ''; // old code, removal?

            // TODO: Daniel
            if(utm){
                store.dispatch('loadInfo');
                store.commit('setUser', undefined);
                store.commit('setLanguage', config.locale.DefaultLanguage);
                return;
            }

            // Old code, removal?
            if(checkSessionResult.status === 403){
                const annonConnectResult = await fetch(`${config.BaseUrl}/client/client_accounts/annon_connect?country=${store.rootState.localization.country}${referer}`, {
                    credentials: 'include'
                });

                sessionData = await annonConnectResult.json() as AnonymousUser;
            } else {
                sessionData = await checkSessionResult.json() as AnonymousUser;
            }

            //since the displayname is set locally, transfer it when setting a new remote user
            if (sessionData && store.state.user){
                sessionData.displayName = store.state.user.displayName;
            }

            store.commit('setUser', transformReadConsumer(sessionData));

            await store.dispatch('setLanguage', sessionData.language);

            if(!notificationSocket.isConnected()){
                notificationSocket.connect();
            }
        },
        async updateUser(store: AuthContext, payload: { user: Consumer | any, notify: string | undefined}){

            if(payload.notify){ 
                payload.user.notification_types = payload.user.notification_types ? payload.user.notification_types : { SSA: false, PRO: false, MSG: false };
                payload.user.notification_types[payload.notify] = payload.user.notification_types[payload.notify] ? false : true;
                const notificationmode = (payload.user.notification_mode === 0 && payload.user.notification_types[payload.notify] === true) ? store.dispatch('displayModal', { name: 'notifications', ref: payload.notify}) : '';
            }

            const { error, result } = await updateConsumer(payload.user);

            if(error){
                store.dispatch('errorMessage', 'account.alerts.errorEditData');
                return;
            }

            store.dispatch('successMessage', 'account.alerts.successEditData');

            store.commit('setUser', result);
        }
    }
};

export default authenticationStore;
