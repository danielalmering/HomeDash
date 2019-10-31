import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';

export interface ModalsState {
    activeModal: string | boolean;
    modalRef?: string;
}

const localizationStore: Module<ModalsState, RootState> = {
    state: {
        activeModal: '',
        modalRef: ''
    },
    getters: {
        getModal: state => {
            return state.activeModal ? true : false;
        },
        getRef: state => {
            return state.modalRef;
        }
    },
    mutations: {
        setActiveModal(state: ModalsState, payload: any){
            if (!payload){
                state.activeModal = false;
                state.modalRef = '';
            } else {
                state.activeModal = payload.name;
                state.modalRef = payload.ref;
            }
        }
    },
    actions: {
        async displayModal(store: ActionContext<ModalsState, any>, payload: { name: string, ref?: string}){
            store.commit('setActiveModal', payload);
            window.scrollTo(0, 0);
        },
        async closeModal(store: ActionContext<ModalsState, any>){
            store.commit('setActiveModal', '');
        }
    }
};

export default localizationStore;