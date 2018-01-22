import Vue from 'vue';
import Router, { RouteConfig } from 'vue-router';
import { Route } from 'vue-router';
import Component from 'vue-class-component';
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
import Newmessage from '../components/pages/account/inbox/newmessage/newmessage';
import Giftvoucher from '../components/pages/account/giftvoucher/giftvoucher';
import Promos from '../components/pages/promos/promos';
import Thankyou from '../components/pages/thankyou/thankyou';
import Payment from '../components/pages/payment/payment';
import Contact from '../components/pages/contact/contact';
import Terms from '../components/pages/textpages/terms';
import Policy from '../components/pages/textpages/policy';
import VideoChat from '../components/pages/videochat/videochat';
import Voyeur from '../components/pages/voyeur/voyeur';

import rootStore from '../store';
import { countryInterceptor, authenticatedInterceptor, safeInterceptor, modalInterceptor, confirmInterceptor, seoInterceptor, preloadUserInterceptor, hotjarInterceptor } from './interceptors';
import { scrollToTop } from '../util';

Vue.use(Router);

const routes = [{
    path: '/:country?/',
    component: { template: '<router-view></router-view>' },
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
                            path: 'edit-data/',
                            name: 'Editdata',
                            component: Editdata
                        },
                        {
                            path: 'account-history/',
                            name: 'History',
                            component: History
                        },
                        {
                            path: 'notifications/',
                            name: 'Inbox',
                            component: Inbox
                        },
                        {
                            path: 'notifications/:performerid/:messageid/',
                            name: 'Readmessage',
                            component: Readmessage
                        },
                        {
                            path: 'new-message/:advertId?/',
                            name: 'Newmessage',
                            component: Newmessage
                        },
                        {
                            path: 'gift-voucher/',
                            name: 'Giftvoucher',
                            component: Giftvoucher
                        }
                    ]
                },
                {
                    path: 'login/',
                    beforeEnter: modalInterceptor('login')
                },
                {
                    path: 'register/',
                    beforeEnter: modalInterceptor('register')
                },
                {
                    path: 'reset-password/:userId/:token/',
                    beforeEnter: modalInterceptor('reset'),
                    component: Performers
                },
                {
                    path: 'confirm/:userId/:token/',
                    beforeEnter: confirmInterceptor
                },
                {
                    path: 'promos/',
                    name: 'Promos',
                    component: Promos,
                    meta: {
                        title: 'footer.metaTitlePromos'
                    }
                },
                {
                    path: 'payment-success/',
                    name: 'Thankyou',
                    beforeEnter: authenticatedInterceptor,
                    component: Thankyou
                },
                {
                    path: 'payment/',
                    name: 'Payment',
                    beforeEnter: authenticatedInterceptor,
                    component: Payment
                },
                {
                    path: 'contact/',
                    name: 'Contact',
                    component: Contact,
                    meta: {
                        title: 'footer.metaTitleContact'
                    }
                },
                {
                    path: 'privacy-policy/',
                    name: 'Policy',
                    component: Policy,
                    meta: {
                        title: 'footer.metaTitlePrivacy'
                    }
                },
                {
                    path: 'terms/',
                    name: 'Terms',
                    component: Terms,
                    meta: {
                        title: 'footer.metaTitleTerms'
                    }
                },
                {
                    path: 'favourites/',
                    name: 'Favourites',
                    component: Favourites
                },
                {
                    path: 'main1/',
                    name: 'Adwords',
                    beforeEnter: (to, from, next) => {
                        next({
                            name: 'Performers',
                            query: { ...to.query, safe: 'true' }
                        });
                    }
                },
                {
                    path: ':category?/',
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
                    path: 'profile/',
                    name: 'Profile',
                    component: Profile
                },
                {
                    path: 'chat/',
                    name: 'Videochat',
                    component: VideoChat
                },
                {
                    path: 'peek/',
                    name: 'Peek',
                    component: VideoChat
                },
                {
                    path: 'voyeur/',
                    name: 'Voyeur',
                    component: Voyeur
                }
            ]
        },
    ]
}] as RouteConfig[];

const router = new Router({
    mode: 'history',
    base: '/',
    routes: makeRoutesStrict(routes)
});

router.beforeEach(preloadUserInterceptor);
router.beforeEach(countryInterceptor);
router.beforeEach(safeInterceptor);
router.beforeEach(hotjarInterceptor);
router.afterEach(() => scrollToTop(600)); //Scroll to top after page changes
router.afterEach(seoInterceptor);

function makeRoutesStrict(routes: RouteConfig[]){

    return routes.map(route => {
        route.pathToRegexpOptions = {
            strict: true
        };

        if(route.children){
            route.children = makeRoutesStrict(route.children);
        }

        return route;
    });
}

export default router;