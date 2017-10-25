import Vuex from 'vuex';
import { Module, ActionContext } from 'vuex';

import { RootState } from './index';

import io from 'socket.io-client';

export interface SocketState {
    socket?: SocketIOClient.Socket
};

const socketStore: Module<SocketState, RootState> = {
    state: {
        socket: undefined 
    },
    getters: {
        isSocketConnected(){

        }
    },
    mutations: {
    },
    actions: {
        async socketMessage(store: ActionContext<SocketState, any>, name: string){
            
        },
        async socketConnect(store: ActionContext<SocketState, RootState>){
            const socket = io.connect('wss://socket.thuis.nl/', {
                forceNew: true,
                transports: ['polling', 'websocket']
            });
            
            socket.connect();
            
            socket.on('connect', function() {
                const user = store.rootState.authentication.user;

                setTimeout(() => {
                    socket.emit('user', {
                        id: user.id,
                        token: user.socketToken,
                        type: 'ROLE_CLIENT'
                    });
                }, 500);
            });

            store.state.socket = socket;
        }
    }
};

export default socketStore;