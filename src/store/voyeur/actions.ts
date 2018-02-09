import { VoyeurContext, maxTilesAllowed, PerformerTile, tileSwitchDelay } from './index';
import { initiateVoyeur, switchVoyeur } from 'sensejs/session/voyeur';

import store from '../';
import config from '../../config';
import { listBusy } from '../../../../SenseCore-FrontNew/performer/performer';
import { initiate, end } from 'SenseJS/session';
import { SessionType } from '../../models/Sessions';
import { get } from 'SenseJS/performer/performer';


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
            throw 'Voyeur declined';
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
            throw 'No performers';
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

            await dispatch('loadTile', { performerId: performerId, position: i });
        }

        switcherooCb = window.setInterval(() => {
            commit('increaseAlive');

            if(state.queue.length === 0){
                return;
            }

            const tileToReplace = getters.replacementTargetIndex;

            dispatch('loadTile', { performerId: state.queue[0], position: tileToReplace });
        }, tileSwitchDelay);
    },
    async loadTile({ commit, getters, rootState, state, dispatch }: VoyeurContext, payload: { performerId: number, position: number }){
        const advertId = getters.performer(payload.performerId).advert_numbers[0].advertNumber;

        const { result, error } = await initiate(SessionType.Video, advertId, {
            clientId: rootState.authentication.user.id,
            performerId: payload.performerId,
            type: 'VOYEURPEEK'
        });

        if(error){
            throw 'Performer declined';
        }

        const tile: PerformerTile = {
            iterationsAlive: 0,
            performer: payload.performerId,
            streamData: {
                id: result.id,
                wowza: result.wowza,
                playStream: result.playStream
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
        const advertId = getters.performer(payload.performerId).advert_numbers[0].advertNumber;

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
                wowza: result.wowza,
                playStream: result.playStream
            }
        };

        commit('setMainTile', tile);
    },
    async swap({ commit, dispatch, state, getters }: VoyeurContext, payload: { performerId: number }){
        //If the performer is already in the main screen, we can jsut ignore this
        if(state.mainTile && state.mainTile.performer === payload.performerId){
            return;
        }

        const tile = state.activeTiles.filter(p => p.performer === payload.performerId);

        //If there is no loaded tile for this performer, switch another tile out for her first
        if(!tile){
            await dispatch('loadTile', {
                performerId: payload.performerId,
                position: getters.replacementTargetIndex
            });
        }

        const { error } = await switchVoyeur(payload.performerId);

        if(error){
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

        console.log('Ended session');

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
            console.log('Wtf? This api call never fails, get outta here');
            return;
        }

        commit('addPerformer', result);
    }
};

export default actions;