import Vue from 'vue';
import Vuex, { Module, ActionContext, Payload } from 'vuex';
import { Performer, PerformerStatus } from '../../models/Performer';
import { RootState } from '../index';

import config from '../../config';
import Voyeur from '../../components/pages/voyeur/voyeur';
import { setInterval } from 'timers';
import notificationSocket from '../../socket';
import rootState from '../index';

interface SocketVoyeurEventArgs {
    performerId: number;
    type: string;
    value: boolean;
    message?: string;
}

interface SocketStatusEventArgs {
    performerId: number;
    status: string;
}

interface SocketServiceEventArgs {
    performerId: number;
    serviceName: string;
    serviceStatus: boolean;
}

type VoyeurContext = ActionContext<VoyeurState, RootState>;

//Time between loading each tile during initialization
const initializationDelay = 1000;

//Maximum amount of tiles that are allowed to be displayed at the same time
const maxTilesAllowed = 1;

//Time between the switching of tiles
const tileSwitchDelay = 5000;

//Switcheroo interval callback
let switcherooCb: NodeJS.Timer | undefined = undefined;

// TODO: Figure out how to remove this timeout
setTimeout(() => {
    notificationSocket.subscribe('voyeur', (data: SocketVoyeurEventArgs) => {

        if(!data) return;

        if(data.message && (data.message === 'BROKE' || data.message === 'HANGUP')){
            //Show broke/hangup alert
            //Route to performer page

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

    //%7B%22performerId%22%3A13135%2C%22serviceName%22%3A%22videocall%22%2C%22serviceStatus%22%3Atrue%7D
    notificationSocket.subscribe('service', (data: SocketServiceEventArgs) => {
        if(!data) return;

        rootState.commit('voyeur/setPerformerService', {
            performerId: data.performerId,
            serviceName: data.serviceName,
            status: data.serviceStatus
        });
    });
});

export interface PerformerTile {
    iterationsAlive: number;
    performer: number;
    streamData: {
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
}

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
        })
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
        state.mainTile = undefined;
        state.isActive = false;
    },
    increaseAlive(state: VoyeurState){
        state.activeTiles.forEach(t => t.iterationsAlive++);
    }
};

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
            throw "Voyeur declined";
        }

        const performersResult = await fetch(`${config.BaseUrl}/performer/performer_accounts/busy?limit=80&offset=0&voyeur=2`, {
            credentials: 'include'
        });

        const performers = await performersResult.json();

        commit('addPerformers', performers.performerAccounts);

        if(state.performers.length === 0){
            throw "No Performers";
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

        switcherooCb = setInterval(() => {
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
            throw "Performer declined";
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
            throw "Performer declined";
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

const getters = {
    favourites(state: VoyeurState){
        return state.performers.filter(p => p.isFavourite);
    },
    reservations(state: VoyeurState){
        return state.performers.filter(p => state.reservations.indexOf(p.id) > -1);
    },
    performer(state: VoyeurState){
        return (id: number) => {
            return state.performers.find(p =>  p.id === id );
        };
    },
    replacementTargetIndex(state: VoyeurState){
        if(state.activeTiles.length < maxTilesAllowed){
            return state.activeTiles.length;
        }

        // const emptyTile = state.activeTiles.findIndex(t => t === undefined);

        // if(emptyTile > -1){
        //     return emptyTile;
        // }

        return state.activeTiles.reduce((selected: number, current: PerformerTile, index: number) => {
            return state.activeTiles[selected].iterationsAlive > current.iterationsAlive ? selected : index;
        }, 0);
    },
    replacementTarget(state: VoyeurState){
        return state.activeTiles.reduce((selected: PerformerTile, current: PerformerTile) => {
            return current.iterationsAlive > selected.iterationsAlive ? current : selected;
        }, state.activeTiles[0]);
    }
};

/**
 *  Open voyeur page
 *
 *  Call voyeur API call to start a voyeur session
 *      -> Success: Continue
 *      -> Error: Go back to homepage
 *
 *  Load a list of all performers that are available for voyeur
 *      -> Empty resultset: Back to homepage
 *      -> Sort performers in a random order
 *      -> Started voyeur from a performers page:
 *          -> Sort that performer to the front of the list so she'll be in the middle
 *      -> Add performers to the list
 *          -> Generate a random pool number for the performer
 *          -> Add to list
 *
 *  Subscribe to status updates on the notification socket
 *      -> Status Changed:
 *          -> If the performer exists broadcast it to other services XXX
 *          -> Performer changes state to anything other than online and is currently not in the list
 *              -> Chill
 *          -> Performer changes state to offline and is currently in the list
 *              -> Chill. Maybe remove because there is noway she still has voyeur at this point ?
 *          -> Update status on the performer object
 *      -> Service Changed:
 *          -> Get the current performer whose service changed, continue if exists
 *          -> Broadcast changes to other services XXX
 *          -> Update the services on the performer object
 *      -> Voyeur Changed:
 *          -> Broke/hangup message:
 *              -> Close the voyeur and display an error message
 *          -> STREAMING type TRUE value = PERFORMER_ONLINE:
 *              -> Retrieve performer through API call
 *              -> Add performer to the list
 *              -> Add performer to the start of the queue
 *              -> Performer is a favorite of the user:
 *                  -> Add to favorite list (Not needed anymore since list can be retrieved from getters
 *          -> STREAMING type FALSE value = PERFORMER_OFFLINE:
 *              -> Remove performer from the list
 *              -> Tile active with this performer:
 *                  -> Get a random new performer
 *                  -> There is no new performer in queue || It's the center performer that left:
 *                      -> Remove the tile from the playing list
 *                      -> Call stopvideo API call for that performer
 *                  -> There is a new performer in the queue:
 *                      GOTO SWITCHEROO
 *              -> Performer in queue:
 *                  -> Remove from queue
 *          -> RESPONSE type FALSE value = PERFORMER_CENTER:
 *              -> Middle performer is outta here, put a new one in the middle... or don't ??
 *
 *  Load all performers into voyeur screen - Can be simplified
 *      -> Add all special blocks to the list first (Favorites, Search, Reservations)
 *      -> Go over the list of performers, foreach:
 *          -> List of active performers is full:
 *              -> Add performer id to queue
 *          -> Get the next available position from a list of premade positions for a certain order
 *          -> Add a X millisecond delay to these actions so the tiles pop in with a delay:
 *              -> If the performer went offline or turned of voyeur in the meantime, drop it
 *              ADDPERFORMER:
 *              -> No performer in the center:
 *                  -> Give the performer position a center position
 *              -> Performer in center && preset no position given:
 *                  -> Find the first available random postion
 *              -> First available position found turns out to be above the max allowed:
 *                  -> Add performer id to queue
 *              -> No block is already present on this position:
 *                  -> Create a block and add it to the playing list
 *              -> Center performer has not completely loaded yet:
 *                  -> Try again in a second. GOTO ADDPERFORMER
 *              STARTVIDEO:
 *              -> Check if the block exists
 *              -> Check what the servicetype of the performer is
 *              -> Do API call to start the video of the performer and get the video params
 *              -> Error: Back to home. Bye.
 *              -> Change the videourl of the block
 *              -> Flag first voyeur as loaded
 *      -> Start switcheero on a timer
 *          -> Get the next performer from the queue, don't make it random because that's not random enough
 *          -> Find the block that has been alive the longest so it can be replaced, ignore the center block in this case
 *          SWITCHEROO:
 *          -> Not all tiles have been filled yet:
 *              GOTO ADDPERFORMER
 *          -> A tile already exists and is getting replaced:
 *              -> Add previous performer that was on this tile to the back of the queue (Not random anymore so we can do this now)
 *              -> Reset the amount of ticks this tile has been alive
 *              -> Update the performerId to that of the new performer
 *              GOTO STARTVIDEO
 *          -> Increase "ticksAlive" for every block
 *
 *  Load favorites
 *      -> Find all performers in the list that are the users favorite and add them to a favorites list (Can be done with a getter in vue)
 *
 *  Start calling ClientSeen API call every 5 seconds
 *
 *  ENDVOYEUR
 *  -> Call stopVideo only for the performer that is currently in the center
 *  -> Reset played and queue list
 *  -> Put first voyeur loaded on false
 *  -> Stop the switcheroo interval
 *  -> Reset the list of active performers
 *  -> Remove events for listening to socket messages
 *  -> Reset list of reservations
 *  -> Stop the clientseen interval
 *
 **/

//Open voyeur page
//Load a list of all performers that are available for voyeur

//Subscribe to status updates on the notification socket
const voyeurState: Module<VoyeurState, RootState> = {
    namespaced: true,
    state: {
        performers: [],
        queue: [],
        activeTiles: [],
        reservations: [],
        mainTile: undefined,
        isActive: false,
    },
    mutations,
    actions,
    getters
};

export default voyeurState;