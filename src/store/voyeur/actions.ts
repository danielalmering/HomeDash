import { VoyeurContext, maxTilesAllowed, PerformerTile, tileSwitchDelay } from './index';

import config from '../../config';


//Switcheroo interval callback
let switcherooCb: number | undefined = undefined;

const actions = {

    async startVoyeur({ state, rootState, commit, dispatch, getters }: VoyeurContext, payload: { ivrCode?: string, performerId: number }){
        const userId = rootState.authentication.user.id;

        const voyeurResult = await fetch(`${config.BaseUrl}/session/initiate_voyeurclient`, {
            credentials: 'include',
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                clientId: payload.ivrCode ? undefined : userId,
                ivrCode: payload.ivrCode,
                payment: payload.ivrCode ? 'IVR' : undefined
            })
        });

        if(!voyeurResult.ok){
            throw 'Voyeur declined';
        }

        const performersResult = await fetch(`${config.BaseUrl}/performer/performer_accounts/busy?limit=80&offset=0&voyeur=2`, {
            credentials: 'include'
        });

        const performers = await performersResult.json();

        commit('addPerformers', performers.performerAccounts);

        if(state.performers.length === 0){
            throw 'No Performers';
        }

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

        const performerResult = await fetch(`${config.BaseUrl}/session/performer_account/performer_number/${advertId}/initiate_videochat`, {
            credentials: 'include',
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                clientId: rootState.authentication.user.id,
                performerId: payload.performerId,
                type: 'VOYEURPEEK'
            })
        });

        if(!performerResult.ok){
            throw 'Performer declined';
        }

        const data = await performerResult.json();

        const tile: PerformerTile = {
            iterationsAlive: 0,
            performer: payload.performerId,
            streamData: {
                wowza: data.wowza,
                playStream: data.playStream
            }
        };

        if(state.activeTiles[payload.position]){

            await fetch(`${config.BaseUrl}/session/end`, {
                credentials: 'include',
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    clientId: rootState.authentication.user.id,
                    performerId: state.activeTiles[payload.position].performer,
                    type: 'VOYEURPEEK'
                })
            });
        }

        commit('setTile',  { tile, position: payload.position });
    },
    async loadMainTile({ commit, getters, rootState }: VoyeurContext, payload: { performerId: number }){
        const advertId = getters.performer(payload.performerId).advert_numbers[0].advertNumber;

        const performerResult = await fetch(`${config.BaseUrl}/session/performer_account/performer_number/${advertId}/initiate_videochat`, {
            credentials: 'include',
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                clientId: rootState.authentication.user.id,
                performerId: payload.performerId,
                type: 'VOYEUR'
            })
        });

        if(!performerResult.ok){
            throw 'Performer declined';
        }

        const data = await performerResult.json();

        const tile: PerformerTile = {
            iterationsAlive: 0,
            performer: payload.performerId,
            streamData: {
                wowza: data.wowza,
                playStream: data.playStream
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

        const result = await fetch(`/session/performer_account/${payload.performerId}/voyeur`);

        if(result.ok){
            commit('swap', payload.performerId);
        }
    },
    async end({ commit, rootState, state }: VoyeurContext){
        await fetch(`${config.BaseUrl}/session/end`, {
            credentials: 'include',
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                clientId: rootState.authentication.user.id,
                type: 'VOYEURCLIENT'
            })
        });

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

        const performerResult = await fetch(`${config.BaseUrl}/performer/performer_accounts/${payload.performerId}`, {
            credentials: 'include'
        });

        if(!performerResult.ok){
            console.log('Wtf? This api call never fails, get outta here');
            return;
        }

        const data = await performerResult.json();

        commit('addPerformer', data.performerAccount);
    }
};

export default actions;