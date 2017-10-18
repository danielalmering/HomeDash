import Vue from 'vue';
import Router from 'vue-router';
import Page from '../components/Page';
import Profiler from '@/components/Profile';

import { countryInterceptor } from './localization';

Vue.use(Router);

export default new Router({
    mode: 'history',
    base: '/',
    routes: [
        {
            path: '/:country?',
            component: { template: '<router-view></router-view>' },
            beforeEnter: countryInterceptor,
            children: [
                {
                    path: '',
                    name: 'Page',
                    component: Page
                }
                // },
                // {
                //     path: 'performer/:id',
                //     name: 'Profile',
                //     component: Profile
                // }
            ]
        }
    ]
});
