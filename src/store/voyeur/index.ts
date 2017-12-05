import Vuex, { Module, ActionContext, Payload } from 'vuex';
import { Performer } from '../../models/Performer';
import { RootState } from '../index';

//Order for loading the tiles during initilization
const initialTileOrder = [6, 1, 5, 8, 11, 12, 13, 7, 4, 3];

//Time between loading each tile during initialization
const initializationDelay = 1000;

//Index of the tile in the center of the screen
const centerTileIndex = 6;

//Maximum amount of tiles that are allowed to be displayed at the same time
const maxTilesAllowed = 13;

//Time between the switching of tiles
const tileSwitchDelay = 2000;

export enum TileType {
    Performer       = 'performer',
    Reservations    = 'reservations',
    Favorites       = 'favorites',
    Search          = 'search'
}

export interface Tile {
    position: number;
    tileType: TileType;
}

export interface PerformerTile extends Tile {
    iterationsAlive: number;
    performer: number;
    streamData: {
        wowza: string;
        playStream: string;
    };
}

export interface VoyeurState {
    performers: Performer[];    //Performers with voyeur activated
    activeTiles: Tile[];        //Tiles that are currently displayed on screen
    queue: number[];            //Id's of performers that are in the queue
}

const mutations = {

};

const actions = {

};

const getters = {
    favourites(state: VoyeurState){
        return state.performers.filter(p => p.isFavourite);
    },
    performer(state: VoyeurState){
        return (id: number) => {
            return state.performers.filter(p => p.id === id);
        };
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
    state: {
        performers: [],
        queue: [],
        activeTiles: []
    },
    mutations,
    actions
};

export default voyeurState;