import Vue from 'vue';
import Vuex from 'vuex';

import { ActionContext } from 'vuex';

import localization from './localization';
import modals from './modals';
import authentication from './authentication';
import socket from './socket';
import performers from './performers';

import { Info } from '../models/Info';

import { AuthState } from './authentication';
import { LocalizationState } from './localization';
import { ModalsState } from './modals';
import { SocketState } from './socket';

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
        performers: performers
    }
});

export default store;