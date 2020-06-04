import store from './../store';
import config from './../config';
import { Performer, PerformerStatus } from 'sensejs/performer/performer.model';
import { isPeekable, isBusy } from 'sensejs/util/performer';

export function getAvatarImage(performer: Performer, size: string){

    if(store.state.safeMode && performer.safe_avatar){
        return `${config.ImageUrl}pimg/${performer.id}/${size}/${performer.safe_avatar.name}`;
    }

    if(!store.state.safeMode && performer.avatar){
        return `${config.ImageUrl}pimg/${performer.id}/${size}/${performer.avatar.name}`;
    }

    return require('./../assets/images/placeholder.png');
}

export function getSliderImages(performer: Performer, photo: any, size: string){
    if(store.state.safeMode && photo.safe_version){
        return `${config.ImageUrl}pimg/${performer}/${size}/${photo.name}`;
    }

    if(!store.state.safeMode){
        return `${config.ImageUrl}pimg/${performer}/${size}/${photo.name}`;
    }

    return require('./../assets/images/placeholder.png');
}

export function hasService(performer: Performer, serviceKey: string): boolean {
    if(!performer){
        return false;
    }

    if (!performer.performer_services) {
        return false;
    }

    if(!serviceKey) {
        return false;
    }

    if(!(serviceKey in performer.performer_services)){
        return false;
    }

    return performer.performer_services[serviceKey];
}


export function getPerformerStatus(performer: Performer){
    if(!performer){ return 'offline'; }

    if( ( [PerformerStatus.Busy, PerformerStatus.OnCall].indexOf(performer.performerStatus) > -1 ) && performer.isVoyeur){
        return 'teaser';
    }

    if(performer.performerStatus === PerformerStatus.OnCall || performer.performerStatus === PerformerStatus.Request){
        return 'busy';
    }

    if(performer.performerStatus === PerformerStatus.Busy){
        return  hasService(performer, 'peek') ? 'peek' : 'busy';
    }

    if(performer.performerStatus === PerformerStatus.Available &&
        hasService(performer, 'cam') ||
        hasService(performer, 'phone') ||
        hasService(performer, 'videocall')){
        return 'available';
    }

    // Performer status Offline
    if (hasService(performer, 'phone')){
        return 'available';
    }

    return 'offline';
}

export function sleep(delay: number): Promise<null>{
    return new Promise( (resolve, reject) => {
        setTimeout(resolve, delay);
    });
}

export function getPerformerLabel(performer: Performer){
    if( ( [PerformerStatus.Busy, PerformerStatus.OnCall].indexOf(performer.performerStatus) > -1 ) && performer.isVoyeur){
        return 'teaser-label';
    }

    if(isPeekable(performer)){
        return 'peek-label';
    }

    if(isBusy(performer)){
        return 'busy-label';
    }

    return 'none';
}

export function goBanner(loggedin: boolean){
    const logged = !loggedin ? this.$store.dispatch('displayModal', { name: 'login' }) : this.$router.push({ name: 'Payment' });
}

export function openModal(name: string, ref?: string){
    this.$store.dispatch('displayModal', { name: name, ref: ref});
}

export function openRoute(name: string){
    this.$router.push({ name: name });
}

export function openTab(url: string, desc?: string){
    window.open(url, '_blank', desc);
}

export function isInSession(status: PerformerStatus){
    return status === PerformerStatus.Busy || status === PerformerStatus.Offline;
}

export function isOutOfSession(status: PerformerStatus){
    return status === PerformerStatus.Offline || status === PerformerStatus.Available;
}

export function tagHotjar(tag: string){
    if(window.hj && config.locale.Hotjar){
        window.hj('tagRecording', [tag]);
    }
}

export function setKPI(url: string, parameters?: any){
    const options: RequestInit = {
        credentials: 'include'
    };
    if (parameters){
        options.method = 'POST';
        options.body = JSON.stringify(parameters);
    }
    const call = fetch(`${config.BaseUrl}/session/kpi/${url}`, options);
    return call;
}

export function getParameterByName(name: string, url?: string) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results) return '';
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export function urlValid() {
    const urludefined = /undefined/.test(window.location.href);
    const agentphantom = /PhantomJS/.test(window.navigator.userAgent);
    return !(urludefined || agentphantom);
}

