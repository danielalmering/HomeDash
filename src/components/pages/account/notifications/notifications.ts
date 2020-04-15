import { Component} from 'vue-property-decorator';
import Vue from 'vue';
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