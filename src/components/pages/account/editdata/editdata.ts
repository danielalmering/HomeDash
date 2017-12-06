import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../models/User';

import config from '../../../../config';

@Component({
    template: require('./editdata.tpl.html')
})
export default class Editdata extends Vue {

    user: User;

    async updateUser(){
        const userResult = await fetch(`${config.BaseUrl}/client/client_accounts/${this.user.id}`, {
            method: 'PUT',
            body: JSON.stringify(this.user),
            credentials: 'include'
        });

        if(!userResult.ok){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorEditData',
                class: 'error'
            });

            return;
        }

        this.$store.dispatch('openMessage', {
            content: 'account.alerts.successEditData',
            class: 'success'
        });

        const userData = await userResult.json();

        this.$store.commit('setUser', userData);
    }

    created(){
        this.user = Object.assign({}, this.$store.state.authentication.user);
    }
}