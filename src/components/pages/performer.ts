import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Sidebar from './profile/sidebar/sidebar';
import Confirmations from '../layout/Confirmations.vue';
import { Route } from 'vue-router/types/router';

@Component({
    template: require('./performer.tpl.html'),
    components: {
        tsidebar: Sidebar,
        tconfirmations: Confirmations
    }
})
export default class Performer extends Vue {

    get displaySidebar(){
        return this.$store.state.displaySidebar;
    }

    public beforeRouteEnter(to:Route, from:Route, next:()=>void){
        console.log("pfff beforerouteenter!!!!");
    }

    public beforeRouteUpdate(to:Route, from:Route, next:(y?:boolean)=>void){
        console.log("pfff route update!!");
    }

    public beforeRouteLeave(to:Route, from:Route, next:(y?:boolean)=>void){
        console.log("pfff route leave!!");
    }

}