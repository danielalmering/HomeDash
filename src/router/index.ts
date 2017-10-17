import Vue from 'vue';
import Router from 'vue-router';
import Page from '../components/Page';
import Performer from '@/components/Performer';

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
                    component: Page,
                    children: [

                    ]
                },
                {
                    path: 'performer/:id',
                    name: 'Performer',
                    component: Performer,
                    children: [
                        {
                            path: '/profile',
                            name: 'Profile',
                            // component: Profile
                        }
                    ]
                }
            ]
        }
    ]
});
