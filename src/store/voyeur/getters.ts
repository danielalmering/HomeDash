import { VoyeurState, maxTilesAllowed, PerformerTile } from './index';
import { PerformerStatus } from '../../models/Performer';

const getters = {
    favourites(state: VoyeurState){
        return state.performers.filter(p => p.isFavourite);
    },
    reservations(state: VoyeurState){
        return state.performers.filter(p => state.reservations.indexOf(p.id) > -1);
    },
    availableReservations(state: VoyeurState){
        return state.performers
            .filter(p => state.reservations.indexOf(p.id) > -1)
            .filter(p => p.performerStatus === PerformerStatus.Available);
    },
    isReservation(state: VoyeurState){
        return (id: number) => {
            const reservations = state.performers.filter(p => state.reservations.indexOf(p.id) > -1);
            return reservations.find(p => p.id === id) != null;
        };
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

        return state.activeTiles.reduce((selected: number, current: PerformerTile, index: number) => {
            return state.activeTiles[selected].iterationsAlive > current.iterationsAlive ? selected : index;
        }, 0);
    },
    replacementTarget(state: VoyeurState){
        return state.activeTiles.reduce((selected: PerformerTile, current: PerformerTile) => {
            return current.iterationsAlive > selected.iterationsAlive ? current : selected;
        }, state.activeTiles[0]);
    },
    idExists(state: VoyeurState){
        return (id: string) => {
            return state.activeTiles.find(t => t.streamData.id === id) !== undefined;
        };
    },
    isMainTile(state: VoyeurState){
        return (id: number) => {
            return state.mainTile && state.mainTile.performer === id;
        };
    }
};

export default getters;