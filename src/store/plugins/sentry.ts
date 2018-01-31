import { Store } from "vuex";
import { RootState } from "../index";

import Raven from 'raven-js';

const sentryPlugin = (store: Store<RootState>) => {

    store.subscribe((mutation, state) => {
        if(!Raven.isSetup()){
            return;
        }

        let data = mutation.payload;

        if(typeof mutation.payload === 'number' || typeof mutation.payload === 'string'){
            data = {
                data: mutation.payload
            };
        }

        Raven.captureBreadcrumb({
            message: `Mutation of type ${mutation.type}`,
            category: 'mutation',
            data: data
        });
    });
}

export default sentryPlugin;