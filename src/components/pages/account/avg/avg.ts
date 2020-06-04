import { Component } from 'vue-property-decorator';
import Vue from 'vue';

import WithRender from './avg.tpl.html';
import { getPersonal } from 'sensejs/consumer';

interface PersonalData {
    email: string;
    ip: string;
    phoneNumbers: string[];
}

@WithRender
@Component
export default class Avg extends Vue {

    personal: PersonalData = {
        email: '', ip: '', phoneNumbers: []
    };

    mounted(){
        this.loadPersonal();
    }

    async loadPersonal(){
        const { result, error } = await getPersonal();

        if(error){
            return;
        }

        this.personal = result;
    }

}