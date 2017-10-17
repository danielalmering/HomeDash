import Vue from 'vue';
import Vuex from 'vuex';

import localization from './localization';
import modals from './modals';

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
        localization: localization,
        modals: modals
    }
});

export default store;