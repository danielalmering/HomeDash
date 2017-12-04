import Vue from 'vue';
import Vuex from 'vuex';

import { ActionContext } from 'vuex';

import localization, { LocalizationState } from './localization';
import modals, { ModalsState } from './modals';
import authentication, { AuthState } from './authentication';
import performers, { PerformersState } from './performers';
import session, { SessionState } from './session';
import alerts, { AlertsState } from './alerts';
import voyeur, { VoyeurState } from './voyeur';

import { Info } from '../models/Info';

import config from '../config';

Vue.use(Vuex);

export interface RootState {
    info: Info | undefined;
    safeMode: boolean;

    authentication?: any;
    localization?: any;
    modals?: any;
}

type RootContext = ActionContext<RootState, RootState>

const store = new Vuex.Store<RootState>({
    state: {
        info: undefined,
        safeMode: false
    },
    getters: {
        getLogoLight: state => {
            const thuis    = require('../assets/images/thuis.png');
            const gigacams = require('../assets/images/gigacams.png');

            if(!state.info){
                return '';
            }

            return state.info.country === 'nl' ? thuis : gigacams;
        },
        getLogoDark: state => {
            const thuis    = require('../assets/images/thuis-dark.png');
            const gigacams = require('../assets/images/gigacams-dark.png');

            if(!state.info){
                return '';
            }

            return state.info.country === 'nl' ? thuis : gigacams;
        }
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
            const infoResult = await fetch(`${config.BaseUrl}/client/client_accounts/info`);
            const infoData: Info = await infoResult.json();

            store.commit('setInfo', infoData);
        }
    },
    modules: {
        localization: localization,
        modals: modals,
        authentication: authentication,
        performers: performers,
        session: session,
        alerts: alerts,
        voyeur: voyeur
    }
});

export default store;