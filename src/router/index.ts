import Vue from 'vue';
import Router from 'vue-router';
import Page from '../components/pages/page';
import Performer from '../components/pages/performer';
import Profile from '../components/pages/profile/profile';
import Performers from '../components/pages/performers/performers';

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
                    component: Page,
                    children: [
                        {
                            path: '',
                            name: 'Performers',
                            component: Performers
                        }
                    ]
                },
                {
                    path: 'performer/:id',
                    name: 'Performer',
                    component: Performer,
                    children: [
                        {
                            path: 'profile',
                            name: 'Profile',
                            component: Profile
                        }
                    ]
                }
            ]
        }
    ]
});
