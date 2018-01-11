import { State } from '../../models/Sessions';
import { SessionState } from './index';

const getters = {
    canStartNewSession: (state: SessionState) => {
        return state.activeState === State.Idle &&
                !state.isSwitching;
    }
};

export default getters;