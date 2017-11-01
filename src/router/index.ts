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
import History from '../components/pages/account/history/history';
import Inbox from '../components/pages/account/inbox/inbox';
import Readmessage from '../components/pages/account/inbox/readmessage/readmessage';
import Giftvoucher from '../components/pages/account/giftvoucher/giftvoucher';
import Payment from '../components/pages/payment/payment';
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
                                },
                                {
                                    path: 'account-history',
                                    name: 'History',
                                    component: History
                                },
                                {
                                    path: 'notifications',
                                    name: 'Inbox',
                                    component: Inbox
                                },
                                {
                                    path: 'notifications/:performerid/:messageid',
                                    name: 'Readmessage',
                                    component: Readmessage
                                },
                                {
                                    path: 'gift-voucher',
                                    name: 'Giftvoucher',
                                    component: Giftvoucher
                                }
                            ]
                        },
                        {
                            path: 'payment',
                            name: 'Payment',
                            component: Payment
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