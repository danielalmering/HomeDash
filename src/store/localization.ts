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

const defaultLanguages: { [country: string]: string } = {
    gl: 'en',
    uk: 'en',
    de: 'de',
    nl: 'nl'
};

const allowedLanguages: { [country: string]: string[] } = {
    gl: ['de', 'en'],
    uk: ['en'],
    de: ['de', 'en'],
    nl: ['nl', 'en']
};

const localizationStore: Module<LocalizationState, RootState> = {
    state: {
        country: undefined,
        language: undefined
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

            // const languageChange = !store.state.language || allowedLanguages[country].indexOf(store.state.language) === -1;

            // if(languageChange){
            //     // store.dispatch('setLanguage', defaultLanguages[country]);
            // }
        },
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