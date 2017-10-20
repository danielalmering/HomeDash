import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';

import io from 'socket.io-client';

export interface SocketState {

};

const socketStore: Module<SocketState, RootState> = {
    state: {

    },
    getters: {
        isSocketConnected(){

        }
    },
    mutations: {
    },
    actions: {
        async sendMessage(store: ActionContext<SocketState, any>, name: string){
            store.commit('setActiveModal', name);
        }
    }
};

export default socketStore;