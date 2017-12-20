import store from './store';
import config from './config';

import { Performer, PerformerStatus } from './models/Performer';

export function getAvatarImage(performer: Performer, size: string){

    if(store.state.safeMode && performer.safe_avatar){
        return `${config.ImageUrl}${performer.id}/${size}/${performer.safe_avatar.name}`;
    }

    if(!store.state.safeMode && performer.avatar){
        return `${config.ImageUrl}${performer.id}/${size}/${performer.avatar.name}`;
    }

    return require('./assets/images/placeholder.png');
}

export function getSliderImage(performer: Performer, photoname: string, size: string){

    if(!store.state.safeMode){
        return `${config.ImageUrl}${performer}/${size}/${photoname}`;
    }

    if(store.state.safeMode){
        return;
    }

    return require('./assets/images/placeholder.png');
}

export function getPerformerStatus(performer: Performer){

    if(performer.performerStatus === PerformerStatus.Available){
        return 'available';
    }

    if(performer.performerStatus === PerformerStatus.OnCall ||
        performer.performerStatus === PerformerStatus.Busy){
        return performer.performer_services['peek'] ? 'peek' : 'busy';
    }

    return 'offline';
}

export function getPerformerLabel(performer: Performer){

    if(performer.performerStatus === PerformerStatus.Busy && performer.performer_services['peek'] === true){
        return 'peek-label';
    }

    if(performer.performerStatus === PerformerStatus.OnCall
        || (performer.performerStatus === PerformerStatus.Busy && performer.performer_services['peek'] === false)){
        return 'busy-label';
    }

    return 'none';
}

export function scrollToTop(scrollDuration: number) {
    const scrollStep = -window.scrollY / (scrollDuration / 15);

    const scrollInterval = setInterval(() => {
        window.scrollY !== 0 ? window.scrollBy(0, scrollStep) : clearInterval(scrollInterval)
    }, 15);
}