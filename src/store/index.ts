import Vue from 'vue';
import Vuex from 'vuex';

import config from '../config';
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
                return {
                    number: '',
                    cpm: ''
                };
            }

            if(!state.info.marketing.current){
                return {
                    number: state.info.phone_number,
                    cpm: state.info.phone_cpm
                };
            } else {
                const activeCampaign = state.info.marketing.current.replace(' ', '_');
                const marketing: any = state.info.marketing;

                return {
                    number: marketing[activeCampaign].phone_number,
                    cpm: marketing[activeCampaign].phone_cpm
                };
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