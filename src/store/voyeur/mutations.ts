import Vue from 'vue';
import { VoyeurState, PerformerTile } from './index';
import { PerformerStatus, Performer } from '../../models/Performer';


const mutations = {
    addPerformers(state: VoyeurState, payload: Performer[]){
        state.performers = state.performers.concat(payload);
        state.queue = state.performers.map(p => p.id);
    },
    addPerformer(state: VoyeurState, performer: Performer){
        state.performers.push(performer);
        state.queue.unshift(performer.id);
    },
    removePerformer(state: VoyeurState, performerId: number){
        state.performers = state.performers.filter(p => p.id !== performerId);
        state.activeTiles = state.activeTiles.filter(t => t.performer !== performerId);

        state.queue = state.queue.filter(id => id !== performerId);

        if(state.mainTile && state.mainTile.performer === performerId){
            state.mainTile = undefined;
        }
    },
    setPerformerStatus(state: VoyeurState, payload: { performerId: number, status: string }){
        state.performers = state.performers.map(performer => {
            if(performer.id !== payload.performerId){
                return performer;
            }

            performer.performerStatus = payload.status as PerformerStatus;

            return performer;
        });
    },
    setPerformerService(state: VoyeurState, payload: { performerId: number, serviceName: string, status: boolean }){
        state.performers = state.performers.map(performer => {
            if(performer.id !== payload.performerId){
                return performer;
            }

            performer.performer_services[payload.serviceName] = payload.status;

            return performer;
        });
    },
    storeIvrCode(state: VoyeurState, ivrCode: string){
        state.ivrCode = ivrCode;
    },
    addReservation(state: VoyeurState, performerId: number){
        state.reservations.push(performerId);
    },
    removeReservation(state: VoyeurState, performerId: number){
        state.reservations = state.reservations.filter(r => r !== performerId);
    },
    setTile(state: VoyeurState, payload: { tile: PerformerTile, position: number }){
        if(state.activeTiles[payload.position]){
            state.queue.push(state.activeTiles[payload.position].performer);
        }

        //Filter out performer from the queue if it hasn't been done yet, remove this from other parts of the code
        state.queue = state.queue.filter(performerId => performerId !== payload.tile.performer);

        Vue.set(state.activeTiles, payload.position, payload.tile);
    },
    setMainTile(state: VoyeurState, tile: PerformerTile){
        state.queue = state.queue.filter(performerId => performerId !== tile.performer);

        state.mainTile = tile;
        state.isActive = true;
    },
    swap(state: VoyeurState, performerId: number){
        const currentTile = state.activeTiles.find(p => p.performer === performerId);

        if(!currentTile){
            return;
        }

        const currentTileClone = Object.assign({}, currentTile);

        if(state.mainTile){
            Vue.set(state.activeTiles, state.activeTiles.indexOf(currentTile), state.mainTile);
        } else {
            state.activeTiles = state.activeTiles.filter(t => t.performer !== performerId);
        }

        state.mainTile = Object.assign({}, currentTileClone);
    },
    reset(state: VoyeurState){
        state.activeTiles = [];
        state.queue = [];
        state.performers = [];
        state.reservations = [];
        state.mainTile = undefined;
        state.isActive = false;
        state.ivrCode = undefined;
    },
    increaseAlive(state: VoyeurState){
        state.activeTiles.forEach(t => t.iterationsAlive++);
    }
};

export default mutations;