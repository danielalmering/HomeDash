import Vuex, { Payload } from 'vuex';
import { Module, ActionContext } from 'vuex';

import rootState, { RootState } from './index';
import { Performer } from '../models/Performer';
import { UserRole } from '../models/User';
import { SessionType, State, PaymentType } from '../models/Sessions';
import config from '../config';

import notificationSocket from '../socket';
import { match } from '../util';

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
    fromVoyeur?: boolean;
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
    fromVoyeur: boolean;
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

notificationSocket.subscribe('videoChat', (data: VideoEventSocketMessage) => {
    console.log('VIDEO EVENT MOTHERFUCKER ', data);
    rootState.dispatch('handleVideoEventSocket', data);
});

const transitions: { [key: string]: State[] } = { //TODO: Added by Lorenzo: Ask Hotze what the edgecase is, removing state transition for now
    [State.Idle]:           [State.InRequest], //TODO: State.Ending Added by Hotze: because of edge case: refresh in chat should fix in videochat.ts beforeDestroy
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

interface StateSocketMessage extends VideoEventSocketMessage{
    inState: State;
}

//translates a socket message to an action to be dispatched when the rule matches.
//Rules are checked from top to bottom
export function translate(socketMessage: StateSocketMessage): { action: string, label?: string } | undefined {
    const rules = [
        {
            when: { type: 'VIDEOCALL_ANSWER' },
            result: { action: 'callAccepted' }
        },
        {
            when: { type: 'VIDEOCALL_FAILED' },
            result: { action: 'callFailed' }
        },
        {
            when: { type: 'VIDEOCALL_DISCONNECT' },
            result: { action: 'callEnded' }
        },
        {
            when: { type: 'RESPONSE', message: 'HANGUP' },
            result: { action: 'end', label: 'PHONE_DISCONNECT' }
        },
        {
            when: { type: 'RESPONSE', message: 'MAIN_ENDED' },
            result: { action: 'end', label: 'MAIN_ENDED' }
        },
        {
            when: { inState: State.Active, type: 'RESPONSE', message: 'CLICK', value: false },
            result: { action: 'end', label: 'PERFORMER_END' }
        },
        {
            when: { inState: State.Active, type: 'RESPONSE', message: 'DISCONNECT', value: false },
            result: { action: 'end', label: 'PERFORMER_END' }
        },
        {
            when: { inState: State.Active, type: 'RESPONSE', message: 'BROKE' },
            result: { action: 'end', label: 'CLIENT_BROKE' }
        },
        {
            when: { inState: State.Pending, value: true },
            result: { action: 'accepted' }
        },
        {
            when: { inState: State.Pending, _stateChange: 'REJPERF' },
            result: { action: 'cancel', label: 'PERFORMER_REJECT'}
        },
        {
            when: { inState: State.Pending, value: 'DISCONNECT' },
            result: { action: 'cancel', label: 'PERFORMER_REJECT'}
        },
        //all other scenario's while pending should result in null
        {
            when: { inState: State.Pending },
            result: undefined
        },
        {
            when: { message: 'CLICK', value: false },
            result: { action: 'cancel', label: 'PERFORMER_END' }
        },
        {
            when: { message: 'DISCONNECT', value: false },
            result: { action: 'cancel', label: 'PERFORMER_END' }
        }
    ];

    const rule = rules.find( check => match(socketMessage, check.when) );
    if (rule){
        return rule.result;
    }

    return undefined;
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
        isSwitching: false,
        fromVoyeur: false
    },
    getters: {
        canStartNewSession: state => {
            return state.activeState === State.Idle &&
                    !state.isSwitching;
        }
    },
    mutations: {
        setState(state: SessionState, toState: State){
            if(!isStateChangeAllowed(state.activeState, toState)){
                throw new Error(`Illegal state change from ${state.activeState} to ${toState}`);
            }

            state.activeState = toState;
        },
        setIvrCode(state:SessionState, toCode:string){
            state.activeIvrCode = toCode;
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
                store.state.fromVoyeur = payload.fromVoyeur !== undefined ? payload.fromVoyeur : false;

                if(payload.sessionType == SessionType.Peek){
                    store.commit('setState', State.Accepted);
                } else {
                    store.commit('setState', State.Pending);
                }
            }

            if (requestResult.ok && requestData.error){
                store.state.activePerformer = store.state.activeSessionType = null;
                store.state.activeIvrCode = undefined;
                store.state.fromVoyeur = payload.fromVoyeur || false;
                store.commit('setState', State.Idle);

                store.dispatch('openMessage', {
                    content: requestData.error,
                    class: 'error'
                });
            }
        },
        async accepted(store: ActionContext<SessionState, RootState>){
            store.commit('setState', State.Accepted);
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
                store.dispatch('errorMessage', `videochat.alerts.socketErrors.${reason}`);
            } else {
                throw new Error('Oh noooooo, ending failed');
            }

            store.commit('setState', State.Idle);
        },
        async disconnected(store: ActionContext<SessionState, RootState>){
            if (store.state.activeState != State.Active){
                return;
            }

            store.commit('setState', State.Ending);
            store.commit('setState', State.Idle);
        },
        async end(store: ActionContext<SessionState, RootState>, reason: string){
            store.commit('setState', State.Ending);
            if (reason == 'PHONE_DISCONNECT'){
                store.commit('setIvrCode', undefined);
            }

            const endResult = await fetch(`${config.BaseUrl}/session/end`, {
                method: 'POST',
                credentials: 'include'
            });

            if(endResult.ok){
                store.commit('setState', State.Idle);
                store.dispatch('errorMessage', `videochat.alerts.socketErrors.${reason}`);
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
                throw new Error(`You are already peeking ${performer.id}. Peek another one dawg`);
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

            const translation = translate( {...content, inState: store.state.activeState} );
            if (translation){
                store.dispatch(translation.action, translation.label);
            } else {
                console.log("UNHANDLED!!")
                console.log(content)
            }

        }
    }
};

export default sessionStore;
