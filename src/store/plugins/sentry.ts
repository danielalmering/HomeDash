import { Store } from "vuex";
import { RootState } from "../index";

import Raven from 'raven-js';

const sentryPlugin = (store: Store<RootState>) => {

    store.subscribe((mutation, state) => {
        if(!Raven.isSetup()){
            return;
        }

        Raven.captureBreadcrumb({
            message: `Mutation of type ${mutation.type}`,
            category: 'mutation',
            data: mutation.payload
        });
    });
}

export default sentryPlugin;