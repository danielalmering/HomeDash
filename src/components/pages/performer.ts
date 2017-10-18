import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import Profile from './profile/profile';

@Component({
    template: require('./performer.tpl.html'),
        components: {
        tprofile: Profile
    }
})
export default class Performer extends Vue {

}