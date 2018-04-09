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
                return [];
            }

            const info = state.info;

            if(!state.info.marketing.current){
                const numbers = [];
                const ivr1 = info.ivr1 ? numbers.push({number: info.ivr1.phone_number, cpm: info.ivr1.phone_cpm, marketing: 0}) : '';
                const ivr2 = info.ivr2 ? numbers.push({number: info.ivr2.phone_number, cpm: info.ivr2.phone_cpm, marketing: 0}) : '';

                return numbers;
            } else {
                const activeCampaign = state.info.marketing.current;
                const marketing: any = state.info.marketing;

                const numbers = [];
                if(info.ivr1){
                    const ivr1 = info.ivr1.marketing != 0 ? numbers.push({number: marketing[activeCampaign].phone_number, cpm: marketing[activeCampaign].phone_cpm, marketing: 1}) : numbers.push({number: info.ivr1.phone_number, cpm: info.ivr1.phone_cpm, marketing: 0});
                }
                if(info.ivr2){
                    const ivr1 = info.ivr2.marketing != 0 ? numbers.push({number: marketing[activeCampaign].phone_number, cpm: marketing[activeCampaign].phone_cpm, marketing: 1}) : numbers.push({number: info.ivr2.phone_number, cpm: info.ivr2.phone_cpm, marketing: 0});
                }

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