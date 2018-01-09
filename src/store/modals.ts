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
    getters: {
        getModal: state => {
            return state.activeModal ? true : false;
        }
    },
    mutations: {
        setActiveModal(state: ModalsState, name: string){
            state.activeModal = name;
        }
    },
    actions: {
        async displayModal(store: ActionContext<ModalsState, any>, name: string){
            store.commit('setActiveModal', name);
            window.scrollTo(0, 0);
        },
        async closeModal(store: ActionContext<ModalsState, any>){
            store.commit('setActiveModal', '');
        }
    }
};

export default localizationStore;