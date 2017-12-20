import Vuex, { Payload } from 'vuex';
import { Module, ActionContext } from 'vuex';

import rootState, { RootState } from './index';
import { Performer } from '../models/Performer';
import { UserRole } from '../models/User';
import { SessionType, State, PaymentType } from '../models/Sessions';
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
    payment?: PaymentType;
}

export interface SessionState {
    activeState: State;
    activeSessionType: SessionType | null;
    activePerformer: Performer | null;
    activeSessionData: SessionData | null;
    activeDisplayName: string;
    activeIvrCode: string | undefined;
    activePaymentType: PaymentType | undefined;
    isSwitching: boolean;
}

interface VideoEventSocketMessageContent {
    type: string;
    value?: string | boolean;
    message?: string;
    _stateChange?: string;
}

export interface VideoEventSocketMessage extends VideoEventSocketMessageContent {
    clientId: number;
    performerId: number;
}

// TODO: Figure out how to remove this timeout
setTimeout(() => {
    notificationSocket.subscribe('videoChat', (data: VideoEventSocketMessage) => {
        console.log('VIDEO EVENT MOTHERFUCKER ', data);

        rootState.dispatch('handleVideoEventSocket', data);
    });
}, 100);

const transitions: { [key: string]: State[] } = {
    [State.Idle]:           [State.InRequest, State.Ending], //TODO: State.Ending Added by Hotze: because of edge case: refresh in chat should fix in videochat.ts beforeDestroy
    [State.InRequest]:      [State.Pending, State.Accepted, State.Canceling, State.Idle],
    [State.Pending]:        [State.Accepted, State.Canceling],
    [State.Accepted]:       [State.Initializing, State.Canceling],
    [State.Initializing]:   [State.Active, State.Canceling],
    [State.Active]:         [State.Ending],
    [State.Canceling]:      [State.Idle],
    [State.Ending]:         [State.Idle]
};

function isStateChangeAllowed(fromState: State, toState: State) {
    if(!transitions.hasOwnProperty(fromState)){
        throw new Error(`State does not exist: ${fromState}`);
    }

    return transitions[fromState].indexOf(toState) > -1;
}

const sessionStore: Module<SessionState, RootState> = {
    state: {
        activeState: State.Idle,
        activeSessionType: null,
        activePerformer: null,
        activeSessionData: null,
        activeDisplayName: '',
        activeIvrCode: undefined,
        activePaymentType: undefined,
        isSwitching: false
    },
    getters: {
    },
    mutations: {
        setState(state: SessionState, toState: State){
            if(!isStateChangeAllowed(state.activeState, toState)){
                throw new Error(`Illegal state change from ${state.activeState} to ${toState}`);
            }

            state.activeState = toState;
        }
    },
    actions: {
        async startRequest(store: ActionContext<SessionState, RootState>, payload: RequestPayload){
            store.commit('setState', State.InRequest);

            const displayName = payload.displayName || store.rootState.authentication.user.username;
            const action = payload.sessionType == SessionType.Peek ? 'peek' : 'chat';

            const requestResult = await fetch(`${config.BaseUrl}/session/request/${action}`, {
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
                    payment: payload.payment
                })
            });

            const requestData = await requestResult.json();

            if(requestResult.ok && requestData.ok){
                store.state.activePerformer = payload.performer;
                store.state.activeDisplayName = displayName;
                store.state.activeSessionType = payload.sessionType;
                store.state.activeIvrCode = payload.ivrCode;
                store.state.activePaymentType = payload.payment;

                if(payload.sessionType == SessionType.Peek){
                    store.commit('setState', State.Accepted);
                } else {
                    store.commit('setState', State.Pending);
                }
            }

            if (requestResult.ok && requestData.error){
                store.state.activePerformer = store.state.activeSessionType = null;
                store.state.activeIvrCode = undefined;
                store.commit('setState', State.Idle);

                store.dispatch('openMessage', {
                    content: requestData.error,
                    class: 'error'
                });
            }
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
                    credentials: 'include',
                    headers: new Headers({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        clientId: store.rootState.authentication.user.id,
                        performerId: store.state.activePerformer ? store.state.activePerformer.id : 0
                    })
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
        async switchPeek(store: ActionContext<SessionState, RootState>, performer: Performer){
            if(store.state.activeState !== State.Active){
                throw new Error(`No peek switch allowed from state ${store.state.activeState}. Try it again when you reach the ${State.Active} state.`);
            }

            if(store.state.activeSessionType !== SessionType.Peek){
                throw new Error(`You can only do a switch while in a ${SessionType.Peek} session type. Current: ${store.state.activeSessionType}`);
            }

            if(store.state.activePerformer && store.state.activePerformer.id === performer.id){
                throw new Error(`You are already peeking ${performer.id}. Pick another one dawg`)
            }

            try {
                store.state.isSwitching = true;

                await store.dispatch('end', 'PEEK_SWITCH');

                await store.dispatch('startRequest', <RequestPayload>{
                    performer: performer,
                    sessionType: store.state.activeSessionType,
                    ivrCode: store.state.activeIvrCode,
                    displayName: store.state.activeDisplayName,
                    payment: store.state.activePaymentType
                });

                store.state.isSwitching = false;
            } catch(ex){
                store.state.isSwitching = false;
                throw ex;
            }
        },
        async initiate(store: ActionContext<SessionState, RootState>){
            store.commit('setState', State.Initializing);

            if(!store.state.activePerformer){
                return; //Do something else
            }

            const isVideoChat = store.state.activeSessionType === SessionType.Video || store.state.activeSessionType === SessionType.Peek;

            const url = isVideoChat ?
                `/performer_account/performer_number/${store.state.activePerformer.advert_numbers[0].advertNumber}/initiate_videochat` :
                `/performer_account/${store.state.activePerformer.advert_numbers[0].advertNumber}/initiate_videocall`;

            let body: string;
            if(store.state.activeIvrCode){
                body = JSON.stringify({
                    chatroomName: store.state.activeDisplayName,
                    ivrCode: store.state.activeIvrCode
                });
            } else {
                body = JSON.stringify({
                    clientId: store.rootState.authentication.user.id,
                    chatroomName: store.state.activeDisplayName
                });
            }

            const initiateResult = await fetch(`${config.BaseUrl}/session${url}`, {
                method: 'POST',
                credentials: 'include',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body
            });

            if(!initiateResult.ok){
                store.dispatch('cancel', 'INITIATE_FAILED');
            }

            const data = await initiateResult.json();

            store.state.activeSessionData = data;
        },
        setActive(store: ActionContext<SessionState, RootState>){
            store.commit('setState', State.Active);

            if(!store.state.activePerformer){
                return;
            }

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
        },
        async startCalling(store: ActionContext<SessionState, RootState>){
            if (!store.state.activePerformer){
                return;
            }

            const result = await fetch(`${config.BaseUrl}/session/start_audio/${store.state.activePerformer.id}`, {
                method: 'POST',
                credentials: 'include',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({ ivrCode: store.state.activeIvrCode })
            });

            if (result.status == 200){
                store.state.activeSessionType = SessionType.VideoCall;
            }
        },
        async stopCalling(store: ActionContext<SessionState, RootState>){
            if (!store.state.activePerformer){
                return;
            }

            const result = await fetch(`${config.BaseUrl}/session/stop_audio`, {
                method: 'POST',
                credentials: 'include',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({ivrCode: store.state.activeIvrCode})
            });

            if (result.status == 200){
                store.state.activeSessionType = SessionType.Video;
            }
        },
        callEnded(store: ActionContext<SessionState, RootState>){
            store.state.activeSessionType = SessionType.Video;
            store.dispatch('openMessage', {
                content: 'videocall.callEnded',
                class: 'error'
            });
        },
        callFailed(store: ActionContext<SessionState, RootState>){
            store.state.activeSessionType = SessionType.Video;
            store.dispatch('errorMessage', 'videocall.callFailed');
        },
        callAccepted(store: ActionContext<SessionState, RootState>){
            store.dispatch('successMessage', 'videocall.callAccepted');
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

            //{type: "VIDEOCALL_ANSWER", value: "false"}
            //{type: "VIDEOCALL_FAILED", value: "false"}
            //{type: "VIDEOCALL_DISCONNECT", value: "false"}
            if (content.type === 'VIDEOCALL_ANSWER'){
                //only now the videocall conversation is really a videocall conversation
                store.dispatch('callAccepted');
                return;
            }

            if (content.type === 'VIDEOCALL_FAILED'){
                store.dispatch('callFailed');
                return;
            }

            if (content.type === 'VIDEOCALL_DISCONNECT'){
                store.dispatch('callEnded');
            }

            //Find a good way to do this shit, need it for testing now
            if(content.type === 'RESPONSE'){

                if(content.message === 'HANGUP'){
                    store.dispatch('end', 'PHONE_DISCONNECT');
                    return;
                }

                if(content.message === 'MAIN_ENDED'){
                    store.dispatch('end', 'MAIN_ENDED');
                    return;
                }

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
        }
    }
};

export default sessionStore;
