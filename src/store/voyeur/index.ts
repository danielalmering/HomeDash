import Vue from 'vue';
import Vuex, { Module, ActionContext } from 'vuex';
import { RootState } from '../index';
import { SocketVoyeurEventArgs, SocketServiceEventArgs, SocketStatusEventArgs } from '../../models/Socket';
import { Performer } from 'sensejs/performer/performer.model';

import rootState from '../index';
import notificationSocket from '../../socket';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';

export type VoyeurContext = ActionContext<VoyeurState, RootState>;

//Time between loading each tile during initialization
export const initializationDelay = 1000;

//Maximum amount of tiles that are allowed to be displayed at the same time
export const maxTilesAllowed = 4;

//Time between the switching of tiles
export const tileSwitchDelay = 5000;

export let canMainEnd = true;

notificationSocket.subscribe('voyeur', (data: SocketVoyeurEventArgs) => {
    if (!rootState.state.voyeur.isActive) return;

    if(!data) return;

    // const isVoyeurEnd = data.type === 'RESPONSE' && data.message === 'MAIN_ENDED' && rootState.getters['voyeur/idExists'](data.id);
    const endMessages = ['BROKE', 'HANGUP'];

    if(data.message && endMessages.indexOf(data.message) > -1){
        // if(data.message === 'MAIN_ENDED' && (!canMainEnd || rootState.getters['voyeur/isMainTile'](data.performerId))){
        //     canMainEnd = false;
        //     setTimeout(() => canMainEnd = true, 1000);

        //     return;
        // }

        rootState.dispatch('voyeur/end', false);

        return;
    }

    if(!data.performerId) return;

    if(data.type === 'STREAMING'){
        rootState.dispatch('voyeur/updatePerformers', { performerId: data.performerId, value: data.value });
        return;
    }
});

notificationSocket.subscribe('status', (data: SocketStatusEventArgs) => {
    if(!data) return;

    rootState.commit('voyeur/setPerformerStatus', {
        performerId: data.performerId,
        status: data.status
    });
});

notificationSocket.subscribe('service', (data: SocketServiceEventArgs) => {
    if(!data) return;

    if(data.services){
        for(const service in data.services){
            rootState.commit('voyeur/setPerformerService', {
                performerId: data.performerId,
                serviceName: service,
                status: data.services[service]
           });
        }
    } else {
        rootState.commit('voyeur/setPerformerService', {
            performerId: data.performerId,
            serviceName: data.serviceName,
            status: data.serviceStatus
       });
    }
});

export interface PerformerTile {
    iterationsAlive: number;
    performer: number;
    streamData: {
        id: string;
        wowza: string;
        playStream: string;
    };
}

export interface VoyeurState {
    performers: Performer[];        //Performers with voyeur activated
    mainTile?: PerformerTile;
    activeTiles: PerformerTile[];   //Tiles that are currently displayed on screen
    reservations: number[];
    queue: number[];                //Id's of performers that are in the queue
    isActive: boolean;
    ivrCode?: string;
    displayName?: string;
}

const voyeurState: Module<VoyeurState, RootState> = {
    namespaced: true,
    state: {
        performers: [],
        queue: [],
        activeTiles: [],
        reservations: [],
        mainTile: undefined,
        isActive: false,
        ivrCode: undefined,
        displayName: undefined
    },
    mutations,
    actions,
    getters
};

export default voyeurState;