import Vuex, { Module, ActionContext, Payload } from 'vuex';

import { RootState } from './index';

export interface AlertsState {
    messages: Message[];
};

export interface MessagePayload extends Payload {
    content: string;
    displayTime?: number;
}

export interface Message {
    id: number;
    content: string;
    displayTime: number;
}

const defaultMessageTime: number = 2500;

const alertsState: Module<AlertsState, RootState> = {
    state: {
        messages: []
    },
    mutations: {
        addMessage(state: AlertsState, message: Message){
            state.messages.push(message);
        },
        removeMessage(state: AlertsState, message: Message | number){
            const id = typeof(message) === 'number' ? message : message.id;

            state.messages = state.messages.filter(m => m.id !== id);
        }
    },
    actions: {
        openMessage(store: ActionContext<AlertsState, RootState>, payload: MessagePayload){
            const message: Message = Object.assign(payload, {
                id: Date.now(),
                displayTime: payload.displayTime ? payload.displayTime : defaultMessageTime
            });

            //Add the message to the list
            store.commit('addMessage', message);

            //Remove message after X amount of time
            setTimeout(() => {
                store.commit('removeMessage', message);
            }, message.displayTime);
        }
    }
};

export default alertsState;