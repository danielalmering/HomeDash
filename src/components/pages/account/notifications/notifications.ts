import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import Pagination from 'sensejs/vue/components/pagination';
import { User } from '../../../../models/User';

import config from '../../../../config';
import WithRender from './notifications.tpl.html';

import modalNotifications from './../../../modal/modal-notifications/modal-notifications';

@WithRender
@Component({
    components: {
        notifications: modalNotifications
    }
})
export default class Notifications extends Vue {

}