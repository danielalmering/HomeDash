import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../../../config';

@Component({
    template: require('./readmessage.tpl.html')
})
export default class Readmessage extends Vue {

    message: any = { client: { id: 0 }, performer_account: { id: 0 }, subject: "" };
    reply: string = '';

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

    async sendMessage(){

        let replymessage = {
            attachments: [],
            clientid: { id: this.message.client.id  },
            content: this.reply,
            performer_account: { id: this.message.performer_account.id },
            sent_by: "CLIENT",
            status: "INBOX",
            subject: this.message.subject
        };

        const newmessageResult = await fetch(`${config.BaseUrl}/performer/performer_account/${this.message.performer_account.id}/email`, {
            method: 'POST',
            body: JSON.stringify(replymessage),
            credentials: 'include'
        });

        if(!newmessageResult.ok){
            //Show error message
            return;
        } else {
            this.reply = '';
        }
    }
}