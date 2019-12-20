import Vuex, { Payload } from 'vuex';
import { Module, ActionContext } from 'vuex';

import rootState, { RootState } from '../index';
import { Performer } from 'sensejs/performer/performer.model';
import { UserRole } from '../../models/User';
import { SessionType, State, PaymentType } from '../../models/Sessions';
import config from '../../config';
import { match } from 'sensejs/util/platform';

import notificationSocket from '../../socket';
import { SocketServiceEventArgs } from '../../models/Socket';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';

export interface SessionData {
    playStream: string;
    playToken: string;
    publishStream?: string;
    publishToken?: string;
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
    streamInfo?: any;
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

    isSwitchModal: boolean;
    switchingPerformer?: Performer;

    fromVoyeur: boolean;
    performerTimeout: any;
}

//don't work??
// 'Cannot assign to 'performerTimeout' because it is not a variable.''
//export var performerTimeout:number;

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

notificationSocket.subscribe('service', (data: SocketServiceEventArgs) => {
    rootState.dispatch('handleServiceEventSocket', data);
});

const transitions: { [key: string]: State[] } = { //TODO: Added by Lorenzo: Ask Hotze what the edgecase is, removing state transition for now
    [State.Idle]:           [State.Idle, State.InRequest], //TODO: State.Ending Added by Hotze: because of edge case: refresh in chat should fix in videochat.ts beforeDestroy
    [State.InRequest]:      [State.Pending, State.Accepted, State.Canceling, State.Idle],
    [State.Pending]:        [State.Accepted, State.Canceling],
    [State.Accepted]:       [State.Initializing, State.Canceling],
    [State.Initializing]:   [State.Active, State.Canceling, State.Ending],
    [State.Active]:         [State.Ending],
    [State.Canceling]:      [State.Idle],
    [State.Ending]:         [State.Idle]
};

export function isStateChangeAllowed(fromState: State, toState: State) {
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
        //all other scenario's while pending should result in undefined
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
        isSwitchModal: false,
        switchingPerformer: undefined,
        fromVoyeur: false,
        performerTimeout: Number.NaN
    },
    getters: getters,
    mutations: mutations,
    actions: actions
};

export default sessionStore;
