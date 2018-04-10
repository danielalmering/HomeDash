import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';

import config from '../config';
import i18n from '../localization';

export interface LocalizationState {
    country?: string;
    language?: string;
}

type LocalizationContext = ActionContext<LocalizationState, RootState>;

const allowedLanguages: { [country: string]: string[] } = {
    gl: ['de', 'en'],
    uk: ['en'],
    de: ['de', 'en'],
    at: ['de', 'en'],
    nl: ['nl', 'en']
};

const localizationStore: Module<LocalizationState, RootState> = {
    state: {
        country: config.Country,
        language: config.locale.DefaultLanguage
    },
    mutations: {
        setLanguage(state: LocalizationState, language: string){
            state.language = language;
        }
    },
    actions: {
        async setLanguage(store: LocalizationContext, language: string){
            if(language !== store.state.language){
                await fetch(`${config.BaseUrl}/localize?language=${language}`, {
                    credentials: 'include'
                });

                store.dispatch('loadInfo');
            }

            i18n.locale = language;

            store.commit('setLanguage', language);
        }
    }
};

export default localizationStore;