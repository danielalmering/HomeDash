import Vuex, { Module, ActionContext, Payload } from 'vuex';
import i18n from '../localization';

import { RootState } from './index';

export interface AlertsState {
    messages: Message[];
}

export interface MessagePayload extends Payload {
    content: string;
    translate?: boolean;
    translateParams?: { [key: string]:  string };
    displayTime?: number;
    class?: string;
}

export interface Message {
    id: number;
    content: string;
    displayTime: number;
    class: string;
}

const defaultMessageTime: number = 2500;

type AlertsContext = ActionContext<AlertsState, RootState>;

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
        openMessage(store: AlertsContext, payload: MessagePayload){

            const needsTranslation = payload.translate === undefined || payload.translate === true;
            const content = needsTranslation ? i18n.t(payload.content, payload.translateParams) : payload.content;

            const message: Message = Object.assign({
                id: Date.now(),
                displayTime: payload.displayTime ? payload.displayTime : defaultMessageTime,
                class: payload.class ? payload.class : 'info',
                content: content
            });

            //Add the message to the list
            store.commit('addMessage', message);

            //Remove message after X amount of time
            setTimeout(() => {
                store.commit('removeMessage', message);
            }, message.displayTime);
        },
        successMessage({ dispatch }: AlertsContext, message: string){
            dispatch('openMessage', {
                content: message,
                class: 'success'
            });
        },
        errorMessage({ dispatch }: AlertsContext, message: string){
            dispatch('openMessage', {
                content: message,
                class: 'error'
            });
        }
    }
};

export default alertsState;