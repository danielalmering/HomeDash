import { Store } from 'vuex';
import { RootState } from '../index';
import * as Sentry from '@sentry/browser'

const sentryPlugin = (store: Store<RootState>) => {

    store.subscribe((mutation, state) => {
        if(!Sentry){
            return;
        }

        let data = mutation.payload;

        if(typeof mutation.payload === 'number' || typeof mutation.payload === 'string'){
            data = {
                data: mutation.payload
            };
        }

        Sentry.addBreadcrumb({
            message: `Mutation of type ${mutation.type}`,
            category: 'mutation',
            data: data
        });
    });
};

export default sentryPlugin;