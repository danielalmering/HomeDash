import Vue from 'vue';
import Vuex from 'vuex';

import localization from './localization';
import { LocalizationState } from './localization';

Vue.use(Vuex);

export interface RootState {
    test: string;
}

const store = new Vuex.Store<RootState>({
    state: {
        test: 'something'
    },
    mutations: {
    },
    modules: {
        localization: localization
    }
});

export default store;