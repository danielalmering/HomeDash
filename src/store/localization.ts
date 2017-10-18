import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';

import i18n from '../localization';

export interface LocalizationState {
    country: string;
    language: string;
};

type LocalizationContext = ActionContext<LocalizationState, RootState>;

const defaultLanguages: { [country: string]: string } = {
    uk: 'en',
    de: 'de',
    nl: 'nl'
};

const allowedLanguages: { [country: string]: string[] } = {
    uk: ['en'],
    de: ['de', 'en'],
    nl: ['nl', 'en']
};

const localizationStore: Module<LocalizationState, RootState> = {
    state: {
        country: 'uk',
        language: 'en'
    },
    mutations: {
        setCountry(state: LocalizationState, country: string){
            state.country = country;
        },
        setLanguage(state: LocalizationState, language: string){
            state.language = language;
        }
    },
    actions: {
        async setCountry(store: LocalizationContext, country: string){
            store.commit('setCountry', country);

            store.dispatch('setLanguage', defaultLanguages[country]);
        },
        async setLanguage(store: LocalizationContext, language: string){
            i18n.locale = language;

            store.commit('setLanguage', language);
        }
    }
};

export default localizationStore;