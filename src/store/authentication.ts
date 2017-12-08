import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';
import { User, AnonymousUser } from '../models/User';
import config from '../config';

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
        async setUser(state: AuthState, user: User | undefined){
            state.user = user;
        }
    },
    actions: {
        async login(store: AuthContext, payload: LoginPayload){
            const loginResult = await fetch(`${config.BaseUrl}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(payload),
                headers: {
                    role: 'ROLE_CLIENT'
                }
            });

            const loginData: User = await loginResult.json();

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

                return;
            }

            store.commit('setUser', loginData);
        },
        async logout(store: AuthContext){
            const logoutResult = await fetch(`${config.BaseUrl}/auth/logout`, {
                credentials: 'include'
            });

            store.commit('setUser', undefined);
        },
        async register(store: AuthContext){
            //Empty
        },
        async getSession(store: AuthContext){
            const checkSessionResult = await fetch(`${config.BaseUrl}/check_session`, {
                credentials: 'include'
            });

            let sessionData: AnonymousUser | undefined = undefined;

            if(checkSessionResult.status === 403){

                const annonConnectResult = await fetch(`${config.BaseUrl}/client/client_accounts/annon_connect`, {
                    credentials: 'include'
                });

                sessionData = await annonConnectResult.json() as AnonymousUser;
            } else {
                sessionData = await checkSessionResult.json() as AnonymousUser;
            }

            store.commit('setUser', sessionData);
            store.dispatch('setCountry', sessionData.country);
        }
    }
};

export default authenticationStore;