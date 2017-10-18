import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';

export interface AuthState {
    loggedIn: boolean;
    user: User | undefined;
};

export interface User {

}

export interface LoginPayload {
    email: string;
    password: string;
}

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
        async login(store: ActionContext<AuthState, any>, payload: LoginPayload){
            let loginResult = await fetch('https://www.thuis.nl/auth/login', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            let loginData: User = await loginResult.json();

            store.commit('setUser', loginData);
        },
        async register(store: ActionContext<AuthState, any>){

        }
    }
};

export default authenticationStore;