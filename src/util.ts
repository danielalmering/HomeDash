import store from './store';

import { Performer } from './models/Performer';

export function getAvatarImage(performer: Performer){

    if(store.state.safeMode && performer.safe_avatar){
        return `//img.thuis.nl/files/pimg/${performer.id}/medium/${performer.safe_avatar.name}`;
    }

    if(!store.state.safeMode && performer.avatar){
        return `//img.thuis.nl/files/pimg/${performer.id}/medium/${performer.avatar.name}`;
    }

    return '//img.thuis.nl/assets/front/img/no-avatar-medium.png';
}