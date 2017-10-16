import Vue from 'vue';
import Router from 'vue-router';
import Page from '../components/Page';
import Performer from '@/components/Performer';

Vue.use(Router);

function countryRouteCreated(){
    const acceptedCountries = ['uk', 'nl', 'de'];
    console.log(this.$route.params.country);

    if(acceptedCountries.indexOf(this.$route.params.country) === -1){
        console.log('Not allowed');

        this.$router.push({ name: 'Page'});
        // console.log();
    }
}

const childRoutes = [
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
        component: Performer
    }
];

export default new Router({
    mode: 'history',
    base: '/',
    routes: [
        {
            path: '/:country',
            component: { template: '<router-view></router-view>', created: countryRouteCreated },
            children: childRoutes
        }
    ]
});
