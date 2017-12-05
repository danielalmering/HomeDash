import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';

export interface ModalsState {
    activeModal: string | boolean;
}

const localizationStore: Module<ModalsState, RootState> = {
    state: {
        activeModal: ''
    },
    mutations: {
        setActiveModal(state: ModalsState, name: string){
            state.activeModal = name;
        }
    },
    actions: {
        async displayModal(store: ActionContext<ModalsState, any>, name: string){
            store.commit('setActiveModal', name);
        },
        async closeModal(store: ActionContext<ModalsState, any>){
            store.commit('setActiveModal', '');
        }
    }
};

export default localizationStore;