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

    if(performer.performerStatus === PerformerStatus.OnCall || performer.performerStatus === PerformerStatus.Request){
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

export function goBanner(loggedin: boolean){
    const logged = !loggedin ? this.$store.dispatch('displayModal', { name: 'login' }) : this.$router.push({ name: 'Payment' });
}

export function openModal(name: string, ref?: string){
    this.$store.dispatch('displayModal', { name: name, ref: ref});
}

export function openRoute(name: string){
    this.$router.push({ name: name });
}

//Webrtc play back possible
export function webrtcPossible(platform:Platform):boolean{
    const supported = [
        {
            name: 'Chrome'
        },
        { //play stream H264 possible for Safari 11+
            name: 'Safari',
            version: '11.0'
        },
        {
            name: 'Firefox'
        },
        {
            name: 'Firefox for Android'
        },
        {
            name: 'Firefox for iOS'
        },
        {
            name: 'Samsung Internet'
        },
        {
            name: 'Chrome Mobile' //both andriod and iOS can play streams
        },
        {
            name: 'Opera'
        }

    ];

    return supported.find( pattern => match(platform, pattern) ) != null;
}

//Webrtc publish possible
export function webrtcPublishPossible(platform:Platform):boolean{
    const supported = [
        {
            name: 'Chrome'
        },
        {
            name: 'Firefox'
        },
        {
            name: 'Samsung Internet'
        },
        {
            name: 'Firefox for Android'
        },
        {   //Publish has te be done by using vp8 codec because of the profile-level-id used on h264
            //This needs te be fixed by Wowza!
            name: 'Safari',
            version: '12.1'
        },
        {
            name: 'Chrome Mobile', //does not work for iOS
            os: {
                family: 'Android'
            }
        },
        {
            name: 'Opera'
        }
    ];

    return supported.find( pattern => match(platform, pattern) ) != null;
}

//IE not killing flash for now, let it use the superior flash plugin
export function isIE(platform:Platform){
    const supported = [
        {
            name: 'IE'
        }
    ];

    return supported.find( pattern => match(platform, pattern) ) != null;
}

//Autoplay fix for safari
export function isWebrtcMuted(platform:Platform): boolean{
    const supported = [
        {
            name: 'Safari'
        }
    ];

    return supported.find( pattern => match(platform, pattern) ) != null;
}

//No flash for mobile
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

export function hasWebAudio():boolean{
    return ('AudioContext' in window) || ('webkitAudioContext' in window);
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

export function getParameterByName(name: string, url?: string) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

