import Vue from 'vue';
import Vuex from 'vuex';

import config from '../config';
import { ActionContext } from 'vuex';

import localization, { LocalizationState } from './localization';
import modals, { ModalsState } from './modals';
import authentication, { AuthState } from './authentication';
import session, { SessionState } from './session/';
import alerts, { AlertsState } from './alerts';
import voyeur, { VoyeurState } from './voyeur';
import sentryPlugin from './plugins/sentry';

import { Info } from '../models/Info';
import { openModal } from '../util';


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
        },
        getSafeMode: state => {
            return state.safeMode;
        },
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
        },
        intervalChecksession: function(store: RootContext){
            setInterval(() => store.dispatch('getSession', true), 60 * 1000); //Update user data every minute
        }
    },
    modules: {
        localization: localization,
        modals: modals,
        authentication: authentication,
        session: session,
        alerts: alerts,
        voyeur: voyeur
    }
});

export default rootStore;