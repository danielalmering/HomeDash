import Vuex, { Payload } from 'vuex';
import { Module, ActionContext } from 'vuex';

import rootState, { RootState } from './index';
import { Performer } from '../models/Performer';
import { UserRole } from '../models/User';
import { SessionType, State } from '../models/Sessions';
import config from '../config';

import notificationSocket from '../socket';

export interface SessionData {
    playStream: string;
    publishStream: string;
    streamTransportType: string;
    wowza: string;
}

export interface RequestPayload extends Payload {
    performer: Performer;
    sessionType: SessionType;
    ivrCode?: string;
    displayName?: string;
}

export interface SessionState {
    activeState: State;
    activeSessionType: SessionType | null;
    activePerformer: Performer | null;
    activeSessionData: SessionData | null;
    activeDisplayName: string;
    activeIvrCode: string;
}

export interface VideoEventSocketMessage {
    clientId: number;
    performerId: number;
    type: string;
    value?: string | boolean;
    message?: string;
    _stateChange?: string;
}

// TODO: Figure out how to remove this timeout
setTimeout(() => {
    notificationSocket.subscribe('videoChat', (data: VideoEventSocketMessage) => {
        console.log('VIDEO EVENT MOTHERFUCKER ', data);

        rootState.dispatch('handleVideoEventSocket', data);
    });
}, 100);

const sessionStore: Module<SessionState, RootState> = {
    state: {
        activeState: State.Idle,
        activeSessionType: null,
        activePerformer: null,
        activeSessionData: null,
        activeDisplayName: '',
        activeIvrCode: ''
    },
    getters: {
    },
    mutations: {
        setState(state: SessionState, newState: State){
            state.activeState = newState;
        }
    },
    actions: {
        async startRequest(store: ActionContext<SessionState, RootState>, payload: RequestPayload){
            store.commit('setState', State.InRequest);

            const displayName = payload.displayName || store.rootState.authentication.user.username;

            const requestResult = await fetch(`${config.BaseUrl}/session/request/chat`, {
                method: 'POST',
                credentials: 'include',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    performerId: payload.performer.id,
                    clientId: store.rootState.authentication.user.id,
                    type: payload.sessionType,
                    name: displayName,
                    ivrCode: payload.ivrCode || undefined,
                    payment: 'CREDITS'
                })
            });

            const requestData = await requestResult.json();

            if(requestResult.ok && requestData.ok){
                store.state.activePerformer = payload.performer;
                store.state.activeDisplayName = displayName;
                store.state.activeSessionType = payload.sessionType;

                store.commit('setState', State.Pending);
            }

            // socketService.subscribe('')

            //"event":"videoChat","receiverId":"5789","receiverType":"ROLE_CLIENT","content":"%7B%22_stateChange%22%3A%22REJPERF%22%2C%22performerId%22%3A158%2C%22clientId%22%3A5789%2C%22type%22%3A%22RESPONSE%22%2C%22value%22%3Afalse%7D","senderType":"ROLE_PERFORMER","senderId":158}"
        },
        async cancel(store: ActionContext<SessionState, RootState>, reason: string){
            store.commit('setState', State.Canceling);

            let result;

            if(reason === 'PERFORMER_REJECT'){
                const performerId = store.state.activePerformer ? store.state.activePerformer.id : 0;

                result = await fetch(`${config.BaseUrl}/session/videochat_request/${performerId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
            } else {
                result = await fetch(`${config.BaseUrl}/session/cancel`, {
                    method: 'POST',
                    credentials: 'include'
                });
            }

            if(result.ok){
                store.commit('setState', State.Idle);
            } else {
                throw new Error('Oh noooooo, ending failed');
            }

            store.commit('setState', State.Idle);
        },
        async end(store: ActionContext<SessionState, RootState>, reason: string){
            store.commit('setState', State.Ending);

            const endResult = await fetch(`${config.BaseUrl}/session/end`, {
                method: 'POST',
                credentials: 'include'
            });

            if(endResult.ok){
                store.commit('setState', State.Idle);
            } else {
                throw new Error('Oh noooooo, ending failed');
            }
        },
        async initiate(store: ActionContext<SessionState, RootState>){
            store.state.activeState = State.Initializing;

            if(!store.state.activePerformer){
                return; //Do something else
            }

            const isVideoChat = store.state.activeSessionType === SessionType.Video || store.state.activeSessionType === SessionType.Peek;

            const url = isVideoChat ?
                `/performer_account/performer_number/${store.state.activePerformer.advert_numbers[0].advertNumber}/initiate_videochat` :
                `/performer_account/${store.state.activePerformer.advert_numbers[0].advertNumber}/initiate_videocall`;

            const initiateResult = await fetch(`${config.BaseUrl}/session${url}`, {
                method: 'POST',
                credentials: 'include',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    clientId: store.rootState.authentication.user.id,
                    chatroomName: store.state.activeDisplayName
                })
            });

            if(!initiateResult.ok){
                store.dispatch('cancel', 'INITIATE_FAILED');
            }

            const data = await initiateResult.json();

            store.state.activeSessionData = data;

            console.log('VideoChat data loaded');
        },
        setActive(store: ActionContext<SessionState, RootState>){
            store.commit('setState', State.Active);

            if(!store.state.activePerformer) return;

            notificationSocket.sendEvent({
                receiverType: UserRole.Performer,
                receiverId: store.state.activePerformer.id,
                event: 'videoChat',
                content: {
                    type: 'START_TIMER_DEVICE',
                    clientId: store.rootState.authentication.user.id,
                    performerId: store.state.activePerformer.id,
                    value: null
                }
            });

            //"{"event": "videoChat","receiverId":"152","receiverType":"ROLE_PERFORMER","content":"%7B%22type%22%3A%22START_TIMER_DEVICE%22%2C%22clientId%22%3A5789%2C%22performerId%22%3A152%2C%22value%22%3Anull%7D"}"
        },
        handleVideoEventSocket(store: ActionContext<SessionState, RootState>, content: VideoEventSocketMessage){
            if(store.state.activeState === State.Idle || !store.state.activePerformer){
                throw new Error('Client shouldn\'t receive this message in an idle state');
            }

            const client = store.rootState.authentication.user;

            if(content.clientId !== client.id ||
                content.performerId !== store.state.activePerformer.id) {
                throw new Error(`Client shouldn\'t receive messages from client: ${content.clientId} and performer: ${content.performerId}`);
            }

            //Find a good way to do this shit, need it for testing now
            if(content.type === 'RESPONSE'){
                if(store.state.activeState === State.Active){
                    //Performer disconnect or manual close
                    if(!content.value && (content.message === 'CLICK' || content.message === 'DISCONNECT')){
                        store.dispatch('end', 'PERFORMER_END');
                    }

                    //Client ran out of credits
                    if(content.message === 'BROKE'){
                        store.dispatch('end', 'CLIENT_BROKE');
                    }

                    return;
                }

                if(store.state.activeState === State.Pending){
                    //The performer has accepted the request
                    if(content.value === true){
                        store.commit('setState', State.Accepted);
                    }

                    //The performer has rejected the request
                    else if(content._stateChange && content._stateChange === 'REJPERF'){
                        store.dispatch('cancel', 'PERFORMER_REJECT');
                        // KPI.send('client_saw_reject');
                    }

                    //The performer has disconnect during the request
                    else if(content.value === 'DISCONNECT'){
                        store.dispatch('cancel', 'PERFORMER_REJECT');
                        // KPI.send('client_saw_disconnect');
                    }

                    return;
                }

                //During any other state the performer has closed the session or disconnected
                if((content.message === 'CLICK' || content.message === 'DISCONNECT') &&
                    content.value === false){
                    store.dispatch('cancel', 'PERFORMER_END');
                }
            }

            //The client has ended the phone payment stream
            else if(content.type === 'HANGUP') {
                if(store.state.activeState === State.Active){
                    store.dispatch('end', 'PHONE_DISCONNECT');
                } else {
                    store.dispatch('cancel', 'PHONE_DISCONNECT');
                }

                // KPI.send('phone_aborted');
            }
        }
    }
};

export default sessionStore;