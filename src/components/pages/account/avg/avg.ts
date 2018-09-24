import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../../config';
import WithRender from './avg.tpl.html';
import { getPersonal } from 'sensejs/consumer';

interface PersonalData {
    email: string;
    ip: number;
    phoneNumbers: Array<any>;
}

@WithRender
@Component
export default class Avg extends Vue {

    personal: PersonalData;

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