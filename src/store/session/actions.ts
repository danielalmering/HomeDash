import { ActionContext } from 'vuex';
import { SessionState, RequestPayload, translate, VideoEventSocketMessage } from './index';
import { RootState } from '../index';
import { State, SessionType } from '../../models/Sessions';
import config from '../../config';
import { Performer } from '../../models/Performer';
import { UserRole } from '../../models/User';
import { SocketServiceEventArgs } from '../../models/Socket';
import notificationSocket from '../../socket';


const actions = {
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
                store.state.performerTimeout = setTimeout( ()=>store.dispatch('performerTimeout'), 60 * 1000 );
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

    //performer did not respond in time
    async performerTimeout(store: ActionContext<SessionState, RootState>){
        store.commit('setState', State.Canceling);
        await fetch(`${config.BaseUrl}/session/timeout/performer`,{
            method: 'POST',
            credentials: 'include',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                performerId: store.state.activePerformer ? store.state.activePerformer.id : undefined,
                clientId: store.rootState.authentication.user.id
            })
        });
        store.commit('setState', State.Idle);
        store.dispatch('errorMessage', `videochat.alerts.socketErrors.PERFORMER_TIMEOUT`);
    },

    async accepted(store: ActionContext<SessionState, RootState>){
        store.commit('setState', State.Accepted);
    },
    async cancel(store: ActionContext<SessionState, RootState>, reason: string = 'CANCEL'){
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
    async end(store: ActionContext<SessionState, RootState>, reason?: string){
        store.commit('setState', State.Ending);
        if (reason === 'PHONE_DISCONNECT'){
            store.commit('setIvrCode', undefined);
        }

        const endResult = await fetch(`${config.BaseUrl}/session/end`, {
            method: 'POST',
            credentials: 'include'
        });

        if(endResult.ok){
            store.commit('setState', State.Idle);

            if(reason){
                store.dispatch('errorMessage', `videochat.alerts.socketErrors.${reason}`);
            }
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
            const previousPerformer = { ...store.state.activePerformer };

            store.state.isSwitching = true;

            await store.dispatch('end');

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
            console.log('UNHANDLED!!');
            console.log(content)
        }

    },

    handleServiceEventSocket(store:ActionContext<SessionState, RootState>, content: SocketServiceEventArgs){
        if (! (store.state.activePerformer && store.state.activePerformer.id == content.performerId) ){
            return;
        }

        store.commit('updateService', {service:content.serviceName,enabled:content.serviceStatus});
    }
};

export default actions;