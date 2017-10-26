import Vue from 'vue';
import Vuex from 'vuex';

import { ActionContext } from 'vuex';

import localization, { LocalizationState } from './localization';
import modals, { ModalsState } from './modals';
import authentication, { AuthState } from './authentication';
import socket, { SocketState } from './socket';
import performers, { PerformersState } from './performers';
import session, { SessionState } from './session';

import { Info } from '../models/Info';

Vue.use(Vuex);

export interface RootState {
    info: Info | undefined;
    safeMode: boolean;

    authentication?: any;
    localization?: any;
    modals?: any;
    socket?: any;
}

type RootContext = ActionContext<RootState, RootState>

const store = new Vuex.Store<RootState>({
    state: {
        info: undefined,
        safeMode: false
    },
    mutations: {
        setInfo: function(state: RootState, info: Info){
            state.info = info;
        },
        activateSafeMode: function(state: RootState){
            state.safeMode = true;
        }
    },
    actions: {
        loadInfo: async function(store: RootContext){
            const infoResult = await fetch('https://www.thuis.nl/api/client/client_accounts/info');
            const infoData: Info = await infoResult.json();

            store.commit('setInfo', infoData);
        }
    },
    modules: {
        localization: localization,
        modals: modals,
        authentication: authentication,
        socket: socket,
        performers: performers,
        session: session
    }
});

export default store;