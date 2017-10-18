import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';

export interface AuthState {
    loggedIn: boolean;
    user: User | undefined;
};

export interface AnonymousUser {
    id: number;
    socketToken: string;

    country: string;
    language: string;
}

export interface User extends AnonymousUser {
    username: string;
    email: string;

    status: string; // Enum
    roles: string[]; //Transform to single
    registerDate: number;
    credits: number;
    mobile_number: string;

    credits_ivr_code: number;
}

export interface LoginPayload {
    email: string;
    password: string;
}

type AuthContext = ActionContext<AuthState, RootState>;

const authenticationStore: Module<AuthState, RootState> = {
    state: {
        loggedIn: false,
        user: undefined
    },
    mutations: {
        async setUser(state: AuthState, user: User | undefined){
            state.user = user;
            state.loggedIn = user !== undefined;
        }
    },
    actions: {
        async login(store: AuthContext, payload: LoginPayload){
            const loginResult = await fetch('https://www.thuis.nl/auth/login', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    role: 'ROLE_CLIENT'
                }
            });

            const loginData: User = await loginResult.json();

            store.commit('setUser', loginData);
        },
        async logout(store: AuthContext){
            const logoutResult = await fetch('https://www.thuis.nl/auth/logout', {
            });

            store.commit('setUser', undefined);
        },
        async register(store: AuthContext){

        }
    }
};

export default authenticationStore;