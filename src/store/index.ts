import Vue from 'vue';
import Vuex from 'vuex';

import { ActionContext } from 'vuex';

import localization from './localization';
import modals from './modals';
import authentication from './authentication';
import socket from './socket';

import { Info } from '../models/Info';

Vue.use(Vuex);

export interface RootState {
    test: string;
    info: Info | undefined;
}

type RootContext = ActionContext<RootState, RootState>

const store = new Vuex.Store<RootState>({
    state: {
        test: 'something',
        info: undefined
    },
    mutations: {
        setInfo: function(state: RootState, info: Info){
            state.info = info;
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
        socket: socket
    }
});

export default store;