import Vue from 'vue';
import Vuex from 'vuex';

import { ActionContext } from 'vuex';

import localization, { LocalizationState } from './localization';
import modals, { ModalsState } from './modals';
import authentication, { AuthState } from './authentication';
import performers, { PerformersState } from './performers';
import session, { SessionState } from './session/';
import alerts, { AlertsState } from './alerts';
import voyeur, { VoyeurState } from './voyeur';
import sentryPlugin from './plugins/sentry';

import { Info } from '../models/Info';

import config from '../config';

Vue.use(Vuex);

export interface RootState {
    displaySidebar: boolean;
    info: Info | undefined;
    safeMode: boolean;
    pagePosition: number;

    authentication?: any;
    localization?: any;
    modals?: any;
    voyeur?: any;
}

type RootContext = ActionContext<RootState, RootState>;

const rootStore = new Vuex.Store<RootState>({
    state: {
        displaySidebar: false,
        info: undefined,
        safeMode: false,
        pagePosition: 0
    },
    plugins: [sentryPlugin],
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
        },
        getCampaignData: state => {
            if(!state.info){
                const numbers = [
                    {number: 0, cpm: 0},
                    {number: 0, cpm: 0}
                ];

                return numbers;
            }

            if(!state.info.marketing.current){
                const numbers = [
                    {number: state.info.ivr1.phone_number, cpm: state.info.ivr1.phone_cpm},
                    {number: state.info.ivr2.phone_number, cpm: state.info.ivr2.phone_cpm}
                ];

                return numbers;
            } else {
                const activeCampaign = state.info.marketing.current;
                const marketing: any = state.info.marketing;
                const nr1 = state.info.ivr1.marketing === 1 ? marketing[activeCampaign].phone_number : state.info.ivr1.phone_number;
                const nr2 = state.info.ivr2.marketing === 1 ? marketing[activeCampaign].phone_number : state.info.ivr2.phone_number;
                const cpm1 = state.info.ivr1.marketing === 1 ? marketing[activeCampaign].phone_cpm : state.info.ivr1.phone_cpm;
                const cpm2 = state.info.ivr2.marketing === 1 ? marketing[activeCampaign].phone_cpm : state.info.ivr2.phone_cpm;

                const numbers = [
                    {number: nr1, cpm: cpm1},
                    {number: nr2, cpm: cpm2}
                ];

                return numbers;
            }
        },
        getBranding: state => {
            return state.info && state.info.country === 'nl';
        }
    },
    mutations: {
        toggleSidebar: function(state: RootState){
            state.displaySidebar = !state.displaySidebar;
        },
        setInfo: function(state: RootState, info: Info){
            state.info = info;
        },
        setPagePosition: function(state: RootState, position: number){
            state.pagePosition = position;
        },
        activateSafeMode: function(state: RootState){
            state.safeMode = true;
        },
        deactivateSafeMode: function(state: RootState){
            state.safeMode = false;
        }
    }, 
    actions: {
        loadInfo: async function(store: RootContext){
            const infoResult = await fetch(`${config.BaseUrl}/client/client_accounts/info`, {
                credentials: 'include'
            });
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

export default rootStore;