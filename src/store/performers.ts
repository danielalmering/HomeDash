import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';
import store from './index';
import config from '../config';

export interface PerformersState {

};

const performersStore: Module<PerformersState, RootState> = {
    state: {

    },
    mutations: {
    },
    actions: {
        async addFavourite(store: ActionContext<PerformersState, RootState>, id: number){
            const userId = store.rootState.authentication.user.id;

            const favoriteResult = await fetch(`${config.BaseUrl}/client/client_accounts/${userId}/favorite_performers/${id}`, {
                credentials: 'include',
                method: 'POST'
            });

            return favoriteResult.json();
        },
        async removeFavourite(store: ActionContext<PerformersState, RootState>, id: number){
            const userId = store.rootState.authentication.user.id;

            const favoriteResult = await fetch(`${config.BaseUrl}/client/client_accounts/${userId}/favorite_performers/${id}`, {
                credentials: 'include',
                method: 'DELETE'
            });

            return favoriteResult.json();
        }
    }
};

export default performersStore;