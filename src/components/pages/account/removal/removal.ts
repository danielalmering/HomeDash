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

    questions: Array<string> = ["quest-1", "quest-2", "quest-3", "quest-4", "quest-5", "quest-6", "quest-7"];

    chosenAnsfer: string | boolean = false;
    openAnsfer: string = '';

    get user(){
        return this.$store.state.authentication.user;
    }

    get credits(){
        return this.$store.state.authentication.user.credits;
    }

    async removeUser(){
        if(!this.chosenAnsfer || !this.user){ 
            return;
        }

        const questionResult = await fetch(`${config.BaseUrl}/performer/performer_account/1/memo`, {
            method: 'POST',
            body: JSON.stringify({ content: JSON.stringify({question: this.chosenAnsfer, other: this.openAnsfer}), client: { id: this.user.id } }),
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