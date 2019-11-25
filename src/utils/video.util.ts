import { Performer } from 'sensejs/performer/performer.model';

export function isWebRTCPerformer(performer: Performer){
    if(performer == null){
        return false;
    }

    if(!performer && performer === undefined){
        return false;
    }

    if(!performer.mediaId  && performer.mediaId === undefined){
        return false;
    }

    return performer.mediaId > 1;
}

export function getViewerType(platform:Platform){
    if(webrtcPublishPossible(platform)){
        if(isIPhone(platform)){
            return '';
        }

        if(isSafari(platform)){
            if(noFlash(platform)) {
                return '';
            }

            return 'rtmpViewer';
        }

        return 'webrtcViewer';
    }

    if (noFlash(platform)){
        return '';
    }

    return 'rtmpViewer';
}

export function webrtcPublishPossible(platform:Platform):boolean{
    const supported = [
        {
            name: 'Chrome',
            version: '23'
        },
        {
            name: 'Firefox',
            version: '22'
        },
        {
            name: 'Samsung Internet',
            version: '4'
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
            name: 'Opera',
            version: '60'
        },
        {
            name: 'Microsoft Edge', //chrome engine is working
            version: '77'
        }
    ];

    return supported.find( pattern => match(platform, pattern) ) != null;
}

//Webrtc play back possible
export function webrtcPossible(platform:Platform):boolean{
    const supported = [
        {
            name: 'Chrome',
            version: '23'
        },
        { //play stream H264 possible for Safari 11+
            name: 'Safari',
            version: '11.0'
        },
        {
            name: 'Firefox',
            version: '22'
        },
        {
            name: 'Firefox for Android'
        },
        {
            name: 'Firefox for iOS'
        },
        {
            name: 'Samsung Internet',
            version: '4'
        },
        {
            name: 'Chrome Mobile' //both andriod and iOS can play streams
        },
        {
            name: 'Opera',
            version: '60'
        },
        {
            name: 'Opera Mobile',
            version: '46'
        },
        {
            name: 'Microsoft Edge', //chrome engine is working
            version: '77.0'
        }

    ];

    return supported.find( pattern => match(platform, pattern) ) != null;
}

export function isIPhone(platform:Platform){
    const supported = [
        {
            product: 'iPhone'
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

export function isSafari(platform:Platform): boolean{
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
                family: 'iOS',
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

export function isIOSNanoCosmos(platform:Platform):boolean{
    const apples = [
        {
            os:{
                family: 'iOS',
                version: '10'
            }
        }

    ];

    return apples.find( pattern => match(platform, pattern) ) != null;
}

export function NanoCosmosPossible(platform: Platform){
    const supported = [
        {
            name: 'Microsoft Edge'
        },
        {
            name: 'Safari',
            version: '10'
        },
        {
            name: 'Chrome',
            version: '54'
        },
        {
            name: 'Chrome Mobile',
            version: '54'
        },
        {
            name: 'Firefox',
            version: '48'
        },
        {
            name: 'IE',
            version: '11.0'
        },
        {
            name: 'Opera'
        }
    ];

    return supported.find( pattern => match(platform, pattern) ) != null;
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