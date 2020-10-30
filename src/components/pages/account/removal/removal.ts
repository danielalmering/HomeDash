import { Component } from 'vue-property-decorator';
import Vue from 'vue';

import { openRoute } from '../../../../utils/main.util';
import WithRender from './removal.tpl.html';

import config from '../../../../config';

import { removeConsumer } from 'sensejs/consumer';

@WithRender
@Component
export default class Removal extends Vue {

    openRoute = openRoute;

    questions: Object = {"quest-1": false, "quest-2": false, "quest-3": false, "quest-4": false, "quest-5": false, "quest-6": false, "quest-7": false, "quest-8": ""};

    get user(){
        return this.$store.state.authentication.user;
    }

    get credits(){
        return this.$store.state.authentication.user.credits;
    }

    async removeUser(){
        const questionfilled = Object.values(this.questions).some(val => val === true);
        if(!this.user && !questionfilled){ 
            return; 
        }

        const questionResult = await fetch(`${config.BaseUrl}/performer/performer_account/1/memo`, {
            method: 'POST',
            body: JSON.stringify({ content: JSON.stringify(this.questions), client: { id: this.user.id } }),
            credentials: 'include'
        });

        if(!questionResult.ok){
            return;
        }

        const { error, result } = await removeConsumer(this.user);

        if(error){
            this.$store.dispatch('errorMessage', 'account.alerts.errorRemoveAccount');
            return;
        }

        this.$store.dispatch('successMessage', 'account.alerts.successRemoveAccount');

        this.$store.dispatch('logout');
        this.openRoute('Performers');
    }

}