import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../../../config';

@Component({
    template: require('./readmessage.tpl.html')
})
export default class Readmessage extends Vue {

    message: any[] = [];

    mounted(){
        this.loadMessage();
    }

    async loadMessage(){

        const messageResults = await fetch(`${config.BaseUrl}/performer/performer_account/${this.$route.params.performerid}/email/${this.$route.params.messageid}`, {
            credentials: 'include'
        });

        if(!messageResults.ok){
            return; //TODO: Error message
        }

        this.message = await messageResults.json();

    }
}