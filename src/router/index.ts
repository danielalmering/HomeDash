import Vue from 'vue';
import Router from 'vue-router';
import { Route } from 'vue-router';
import Page from '../components/pages/page';
import Performer from '../components/pages/performer';
import Profile from '../components/pages/profile/profile';
import Performers from '../components/pages/performers/performers';
import Favourites from '../components/pages/performers/favourites';
import Account from '../components/pages/account/account';
import Editdata from '../components/pages/account/editdata/editdata';
import VideoChat from '../components/pages/videochat/videochat';

import { countryInterceptor, authenticatedInterceptor, safeInterceptor } from './interceptors';

Vue.use(Router);

const router = new Router({
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
                            path: 'my-account',
                            name: 'Account',
                            component: Account,
                            beforeEnter: authenticatedInterceptor,
                            children: [
                                {
                                    path: 'edit-data',
                                    name: 'Editdata',
                                    component: Editdata
                                }
                            ]
                        },
                        {
                            path: 'favourites',
                            name: 'Favourites',
                            component: Favourites
                        },
                        {
                            path: ':category?',
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
                        },
                        {
                            path: 'chat',
                            name: 'Videochat',
                            component: VideoChat
                        }
                    ]
                }
            ]
        }
    ]
});

router.beforeEach(safeInterceptor);

export default router;