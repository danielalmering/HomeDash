import store from './store';
import config from './config';
import { Performer, PerformerStatus } from 'sensejs/performer/performer.model';
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

export function getSliderImages(performer: Performer, photoname: string, size: string){
    return `${config.ImageUrl}pimg/${performer}/${size}/${photoname}`;
}

export function getPerformerStatus(performer: Performer){

    if( ( [PerformerStatus.Busy, PerformerStatus.OnCall].indexOf(performer.performerStatus)>-1 ) && performer.isVoyeur){
        return 'teaser';
    }

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

export function sleep(delay: number):Promise<null>{
    return new Promise( (resolve, reject)=>{
        setTimeout(resolve, delay);
    })
}

export function getPerformerLabel(performer: Performer){
    if( ( [PerformerStatus.Busy, PerformerStatus.OnCall].indexOf(performer.performerStatus)>-1 ) && performer.isVoyeur){
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

export function openModal(name: string){
    this.$store.dispatch('displayModal', name);
}

export function openRoute(name: string){
    this.$router.push({ name: name });
}

export function webrtcPossible(platform:Platform):boolean{
    const supported = [
        {
            name: 'Chrome'
        },
        {
            name: 'Safari',
            version: '11.0'
        }
    ];

    return supported.find( pattern => match(platform, pattern) ) != null;
}

export function hasWebAudio():boolean{
    return ('AudioContext' in window) || ('webkitAudioContext' in window);
}

export function noFlash(platform:Platform):boolean{
    const noFlashers = [
        {
            os:{
                family: 'iOS'
            }
        },
        {
            os:{
                family: 'Android'
            }
        }
    ];

    return noFlashers.find( pattern => match(platform, pattern) ) != null;
}

export function isApple(platform:Platform):boolean{
    console.log(platform);
    const apples = [
        {
            os:{
                family: 'iOS'
            }
        },
        {
            os:{
                family: 'OS X'
            }
        }
    ];
    console.log(apples);
    return apples.find( pattern => match(platform, pattern) ) != null;
}

export function isIOS(platform:Platform):boolean{
    const apples = [
        {
            os:{
                family: 'iOS'
            }
        } 
    ];

    return apples.find( pattern => match(platform, pattern) ) != null;
}

// checks if 'pattern' is a subset of 'message'
// eg match( {id:3, text:"bla"}, {text:"bla"} ) => true
export function match(message:any, pattern:any):boolean{
    for(const prop in pattern){
        if (! (prop in message) ){
            return false;
        }

        if ( (typeof pattern[prop] === 'object') && (typeof message[prop] === 'object')){
            //recursive matching. No guards!
            if (!match(message[prop], pattern[prop])){
                return false;
            }

        } else if (prop == 'version'){
            //the 'version' property in the message should be equal or bigger than the one in the pattern.
            if (smaller(message.version, pattern.version)){
                return false;
            }
        } else if( pattern[prop] != message[prop] ){
            return false;
        }
    }
    return true;
}

//checks if version, formatted as <major>.<minor>.<evenmoreminor>... is smaller than 'than' formatted the same way.
//eg smaller("47.0.2526.111", "47.0.2530.9") => true
function smaller(version:string, than:string):boolean{
    const versionList: number[] = toInts(version);
    const thanList: number[] =  than.split('.').map(num => parseInt(num));

    if (! (versionList.length && thanList.length) ){
        return false;
    }

    for(var k=0; k<thanList.length; k++){
        //happens eg. with version("48", "47.1")
        if (k >= versionList.length){
            return false;
        }

        if (versionList[k] > thanList[k] ){
            return false;
        }

        if (versionList[k] < thanList[k] ){
            return true;
        }

        //on equal: go to the next option.
    }

    return false;
}

function toInts(version:string):number[]{
    const result = version.split('.').map(num => parseInt(num));
    for(const num of result){
        if ( isNaN(num) ) return [];
    }
    return result;
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
