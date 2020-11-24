import { VoyeurContext, maxTilesAllowed, PerformerTile, tileSwitchDelay } from './index';
import { initiateVoyeur, switchVoyeur } from 'sensejs/session/voyeur';

import store from '../';
import config from '../../config';
import router from '../../router';
import { initiate, end, SessionType } from 'sensejs/session';
import { get, listBusy } from 'sensejs/performer';
import { warn, error as logError } from '../../utils/main.util';

//Switcheroo interval callback
let switcherooCb: number | undefined = undefined;

const actions = {

    async startVoyeur({ state, rootState, commit, dispatch, getters }: VoyeurContext, payload: { ivrCode?: string, displayName?: string, performerId: number }){
        const userId = rootState.authentication.user.id;

        const { error } = await initiateVoyeur({
            clientId: payload.ivrCode ? undefined : userId,
            ivrCode: payload.ivrCode,
            payment: payload.ivrCode ? 'IVR' : undefined
        });

        if(error){
            store.dispatch('openMessage', {
                content: error.message,
                class: 'error'
            });

            if(error.message == 'Onvoldoende credits') {
                dispatch('end').then(() => {
                    router.push({ name: 'Payment' });
                }).catch((ex) => {
                    router.push({ name: 'Payment' });
                });
            }
        }

        if(payload.ivrCode){
            commit('storeIvrCode', payload.ivrCode);
        }

        commit('storeDisplayName', payload.displayName);

        const { result, error: performerError } = await listBusy({
            limit: 80,
            offset: 0,
            voyeur: 2
        });

        if(performerError || result.total === 0 || result.performerAccounts.length === 0){
            store.dispatch('openMessage', {
                content: 'sidebar.noperformers',
                class: 'error'
            });
        }

        commit('addPerformers', result.performerAccounts);

        await dispatch('loadMainTile', {
            performerId: payload.performerId
        });

        for(let i = 0; i < maxTilesAllowed; i++){

            if(state.queue.length === 0){
                break;
            }

            const performerId = state.queue[0];

            try {
                await dispatch('loadTile', { performerId: performerId, position: i });
            } catch { continue; }
        }

        switcherooCb = window.setInterval(async () => {
            commit('increaseAlive');


            do {
                if(state.queue.length === 0){
                    return;
                }

                const tileToReplace = getters.replacementTargetIndex;

                try {
                    await dispatch('loadTile', { performerId: state.queue[0], position: tileToReplace });
                    break;
                }catch{
                    logError('failed loading tile');
                }
            } while(true);
        }, tileSwitchDelay);
    },
    async loadTile({ commit, getters, rootState, state, dispatch }: VoyeurContext, payload: { performerId: number, position: number }){
        const advertId = getters.performer(payload.performerId).advertId;
        if(!advertId){ return; }

        // const activePerformers = state.activeTiles.map( tile => tile.performer );
        // if (state.mainTile){
        //     activePerformers.push(state.mainTile.performer);
        // }

        // if (activePerformers.includes( payload.performerId )){
        //     commit('unQueue', payload.performerId)
        //     throw 'Double Performer'
        // }


        const { result, error } = await initiate(SessionType.Video, advertId, {
            clientId: rootState.authentication.user.id,
            performerId: payload.performerId,
            type: 'VOYEURPEEK'
        });

        if(error){
            commit('removePerformer', payload.performerId);
            throw 'Performer declined';
        }

        const tile: PerformerTile = {
            iterationsAlive: 0,
            performer: payload.performerId,
            streamData: {
                id: result.id,
                wowza: result.playWowza,
                playStream: result.playStream,
                playToken: result.playToken,
                streamTransportType: result.playStreamTransportType
            }
        };

        if(state.activeTiles[payload.position]){
            await end({
                clientId: rootState.authentication.user.id,
                performerId: state.activeTiles[payload.position].performer,
                type: 'VOYEURPEEK'
            });
        }

        commit('setTile',  { tile, position: payload.position });
    },
    async loadMainTile({ commit, getters, rootState }: VoyeurContext, payload: { performerId: number }){
        const advertId = getters.performer(payload.performerId).advertId;
        if(!advertId){ return; }

        const { result, error } = await initiate(SessionType.Video, advertId, {
            clientId: rootState.authentication.user.id,
            performerId: payload.performerId,
            type: 'VOYEUR'
        });

        if(error){
            throw 'Performer declined';
        }

        const tile: PerformerTile = {
            iterationsAlive: 0,
            performer: payload.performerId,
            streamData: {
                id: result.id,
                wowza: result.playWowza,
                playStream: result.playStream,
                playToken: result.playToken,
                streamTransportType: result.playStreamTransportType
            }
        };

        commit('setMainTile', tile);
    },
    async swap({ commit, dispatch, state, getters }: VoyeurContext, payload: { performerId: number }){
        //If the performer is already in the main screen, we can jsut ignore this
        console.log('swap', payload);

        if(state.mainTile && state.mainTile.performer === payload.performerId){
            return;
        }

        const tile = state.activeTiles.find(p => p.performer === payload.performerId);

        //If there is no loaded tile for this performer, switch another tile out for her first
        if(!tile){
            try {
                await dispatch('loadTile', {
                    performerId: payload.performerId,
                    position: getters.replacementTargetIndex
                });
            } catch {
                return;
            }
        }

        const { error } = await switchVoyeur(payload.performerId);

        if(!error){
            commit('swap', payload.performerId);
        }
    },
    async end({ commit, rootState, state }: VoyeurContext, silent: boolean = false){
        if(!state.isActive){
            throw 'Voyeur is not active';
        }

        if(!silent){
            end({
                clientId: rootState.authentication.user.id,
                type: 'VOYEURCLIENT'
            });
        }

        if(switcherooCb){
            clearInterval(switcherooCb);
        }

        commit('reset');
    },
    async switcheroo({ dispatch, getters, state }: VoyeurContext, payload: { performerId: number, target: number }){

        await dispatch('loadTile', {
            performerId: payload.performerId,
            location: payload.target
        });
    },
    async updatePerformers({ commit }: VoyeurContext, payload: { performerId: number, value: boolean }){
        if(!payload.value){
            commit('removePerformer', payload.performerId);

            return;
        }

        const { result, error } = await get(payload.performerId);

        if(error){
            return;
        }

        commit('addPerformer', result);
    }
};

export default actions;
