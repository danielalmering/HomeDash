import { ActionContext } from 'vuex';
import { SessionState, RequestPayload, translate, VideoEventSocketMessage } from './index';
import { RootState } from '../index';
import { State, SessionType } from '../../models/Sessions';
import config from '../../config';
import { Performer } from '../../models/Performer';
import { UserRole } from '../../models/User';
import { SocketServiceEventArgs } from '../../models/Socket';
import notificationSocket from '../../socket';
import { tagHotjar } from '../../util';
import i18n from '../../localization';
import { startRequest, deleteVideorequest, cancel, end, performerTimeout, startCall, endCall } from 'SenseJS/session/index';

const actions = {
    async startRequest(store: ActionContext<SessionState, RootState>, payload: RequestPayload){
        store.commit('setState', State.InRequest);

        let displayName: string = payload.displayName || store.rootState.authentication.user.username;

        //annon_blablablabla is a lame name, let's replace it
        if(displayName && displayName.indexOf('annon_') > -1){
            displayName = i18n.t('videochat.anonymous').toString();
        }

        const { error, result } = await startRequest({
            performerId: payload.performer.id,
            clientId: store.rootState.authentication.user.id,
            type: payload.sessionType,
            name: displayName,
            ivrCode: payload.ivrCode || undefined,
            payment: payload.payment
        });

        if(!error){
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

            tagHotjar(`SESSION_${payload.sessionType.toUpperCase()}_${payload.payment ? payload.payment : 'NONE'}`);
        }

        if (error){
            store.state.activePerformer = store.state.activeSessionType = null;
            store.state.fromVoyeur = payload.fromVoyeur || false;
            store.commit('setState', State.Idle);

            store.dispatch('openMessage', {
                content: error.message,
                class: 'error'
            });

            tagHotjar(`ERROR_${payload.sessionType.toUpperCase()}REQUEST`);
        }
    },

    //performer did not respond in time
    async performerTimeout(store: ActionContext<SessionState, RootState>){
        store.commit('setState', State.Canceling);

        await performerTimeout({
            performerId: store.state.activePerformer ? store.state.activePerformer.id : 0,
            clientId: store.rootState.authentication.user.id
        });

        store.commit('setState', State.Idle);
        store.dispatch('errorMessage', `videochat.alerts.socketErrors.PERFORMER_TIMEOUT`);

        tagHotjar(`ERROR_PERFORMERTIMEOUT`);
    },

    async accepted(store: ActionContext<SessionState, RootState>){
        store.commit('setState', State.Accepted);
    },
    async cancel(store: ActionContext<SessionState, RootState>, reason: string = 'CANCEL'){
        store.commit('setState', State.Canceling);

        const performerId = store.state.activePerformer ? store.state.activePerformer.id : 0;
        let hasError;

        if(reason === 'PERFORMER_REJECT'){
            const { error } = await deleteVideorequest(performerId);
            hasError = error !== undefined;
        } else {
            const { error } = await cancel({
                clientId: store.rootState.authentication.user.id,
                performerId: performerId
            });
            hasError = error !== undefined;
        }

        if(!hasError){
            store.commit('setState', State.Idle);
            store.dispatch('errorMessage', `videochat.alerts.socketErrors.${reason}`);

            tagHotjar(`CANCEL_${reason}`);
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

        const { error } = await end();

        if(!error){
            store.commit('setState', State.Idle);

            if(reason){
                tagHotjar(`END_${reason}`);

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

            /* Switching failed man, the new performer is not available, lets go back to the previous
             * If the previous is gone, well fuck me, session is just gonna have to stop..
             * Why am I casting a State to State? Well this ain't this a state... this is State.Active specifically right now
             * That's because I did a check to see if it was at the top of this function and it couldnt have possibly changed meanwhile, right.. ?
             */

            if((store.state.activeState as State) === State.Idle){
                await store.dispatch('startRequest', <RequestPayload>{
                    performer: previousPerformer,
                    sessionType: SessionType.Peek,
                    ivrCode: store.state.activeIvrCode,
                    displayName: store.state.activeDisplayName,
                    payment: store.state.activePaymentType
                });

                tagHotjar(`PEEKSWITCH_FAIL`);
            } else {
                tagHotjar(`PEEKSWITCH_SUCCESS`);
            }

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

            tagHotjar(`ERROR_INITIATE`);
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

        const { error } = await startCall(store.state.activePerformer.id, {
            ivrCode: store.state.activeIvrCode || ''
        });

        if (!error){
            store.state.activeSessionType = SessionType.VideoCall;
        }
    },
    async stopCalling(store: ActionContext<SessionState, RootState>){
        if (!store.state.activePerformer){
            return;
        }

        const { error } = await endCall({
            ivrCode: store.state.activeIvrCode || ''
        });

        if (!error){
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