import Vue from 'vue';
import Vuex from 'vuex';

import { ActionContext } from 'vuex';

import localization from './localization';
import modals from './modals';
import authentication from './authentication';

Vue.use(Vuex);

export interface RootState {
    test: string;
    info: Info | undefined;
}

export interface Info {
    categories: { slug: string, title: string }[];
    countries: string[];
    country: string;
    credits_per_email: string;
    credits_per_minute: string;
    credits_per_sms: string;
    language: string;
    languages: string[];
    mail_cpm: number;
    mail_enabled: number;
    marketing: {
        current: string;
        happy_hour: {
            phone_number: string;
            phone_cpm: number;
        }
    },
    phone_cpm: number;
    phone_enabled: 1;
    phone_number: string;
    phone_number_free: string;
    sms_cpt: number;
    sms_enabled: number;
    sms_number: 4500;
    tags: string[];
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
        authentication: authentication
    }
});

export default store;