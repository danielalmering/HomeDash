import store from './store';
import config from './config';
import { Performer, PerformerStatus } from 'SenseJS/performer/performer.model';
import { isPeekable, isBusy } from 'sensejs/util/performer';

export function getAvatarImage(performer: Performer, size: string){

    if(store.state.safeMode && performer.safe_avatar){
        return `${config.ImageUrl}pimg/${performer.id}/${size}/${performer.safe_avatar.name}`;
    }

    if(!store.state.safeMode && performer.avatar){
        return `${config.ImageUrl}pimg/${performer.id}/${size}/${performer.avatar.name}`;
    }

    return require('./assets/images/placeholder.png');
}

export function getPerformerStatus(performer: Performer){

    if(performer.performerStatus === PerformerStatus.OnCall){
        return 'busy';
    }

    if(performer.performerStatus === PerformerStatus.Busy){
        return performer.performer_services['peek'] ? 'peek' : 'busy';
    }

    if(performer.performerStatus === PerformerStatus.Available &&
        performer.performer_services['cam'] ||
        performer.performer_services['phone'] ||
        performer.performer_services['videocall']){

        return 'available';
    }

    // Performer status Offline
    if(performer.performer_services['phone']){
        return 'available';
    }

    return 'offline';
}

export function getPerformerLabel(performer: Performer){

    if(isPeekable(performer)){
        return 'peek-label';
    }

    if(isBusy(performer)){
        return 'busy-label';
    }

    return 'none';
}

export function openModal(name: string){
    this.$store.dispatch('displayModal', name);
}

export function openRoute(name: string){
    this.$router.push({ name: name });
}

export function tagHotjar(tag: string){
    if(window.hj){
        console.log(tag);
        window.hj('tagRecording', [tag]);
    }
}