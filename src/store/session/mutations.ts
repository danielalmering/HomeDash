import { SessionState, isStateChangeAllowed } from './index';
import { State } from '../../models/Sessions';
import { Performer } from 'sensejs/performer/performer.model';

const mutations = {
    setState(state: SessionState, toState: State){
        if(!isStateChangeAllowed(state.activeState, toState)){
            throw new Error(`Illegal state change from ${state.activeState} to ${toState}`);
        }

        state.activeState = toState;
        if (toState != State.Pending){
            state.performerTimeout && clearTimeout(state.performerTimeout);
        }
    },
    setIvrCode(state:SessionState, toCode:string){
        state.activeIvrCode = toCode;
    },
    updateService(state:SessionState, payload:{service:string, enabled:boolean}){
        if (!state.activePerformer){
            return;
        }
        state.activePerformer.performer_services[payload.service] = payload.enabled;
    },
    toggleSwitchModal(state: SessionState, payload: { state: boolean, performer: Performer }){
        state.isSwitchModal = payload.state;

        if(state.isSwitchModal){
            state.switchingPerformer = payload.performer;
        } else {
            state.switchingPerformer = undefined;
        }
    }
}

export default mutations;