import Vue from 'vue';
import Vuex from 'vuex';

import config from '../config';
import { ActionContext } from 'vuex';

import devices from './devices';


Vue.use(Vuex);

export interface RootState {
}

type RootContext = ActionContext<RootState, RootState>;

const rootStore = new Vuex.Store<RootState>({
    state: {
    },
    getters: {
    },
    mutations: {
    },
    actions: {
    },
    modules: {
        devices: devices
    }
});

export default rootStore;