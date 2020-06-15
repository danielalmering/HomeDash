import {NanoCosmosPossible, webrtcPossible, webrtcPublishPossible, isIE, isIOSNanoCosmos} from '../../../utils/video.util';
import {SessionType} from '../../../models/Sessions';

// Before any changes are made read the readme.publisher!!

export function webrtcPublisher(platform: any, sessionType: string){
    if(platform) {
        if(webrtcPossible(platform)){
            return 'webrtc';
        }

        if(NanoCosmosPossible(platform)){
            return sessionType == SessionType.Peek ? 'nanocosmos' : 'jsmpeg';
        }

        if(isIE(platform)) {
            return 'rtmp';
        }
    }

    //always default to jsmpeg
    return 'jsmpeg';
}

export function clubsenseStreamerPublisher(platform: any, sessionType: string){
    if(platform){
        if(NanoCosmosPossible(platform)){
            return 'nanocosmos';
        }

        if(isIE(platform)){
            return 'rtmp';
        }
    }

    return 'jsmpeg';
}

export function flashPublisher(platform: any, sessionType: string){
    if(platform){
        // DEBUG:
        // if(NanoCosmosPossible(platform)) {
        //     return sessionType == SessionType.Peek ? 'nanocosmos' : 'jsmpeg';
        // }

        //if iOS device use nanocosmos else use jsmpeg
        // if(NanoCosmosPossible(platform) && isIOSNanoCosmos(platform)) {
        //     return 'nanocosmos';
        // }

        if(isIE(platform)){
            return 'rtmp';
        }

        return 'jsmpeg';
    }

    return 'jsmpeg';
}