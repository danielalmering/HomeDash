import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../../models/User';

import config from '../../../../../config';

interface MessageForm {
    subject: string;
    content: string;
}

@Component({
    template: require('./newmessage.tpl.html')
})
export default class Newmessage extends Vue {

    message: MessageForm = { subject: "", content: "" };

    performers: any[] = [];    
    selectedperf: any[] =[];
    selectedusername: string = '';
    selectedid: number;

    mounted(){
        this.loadPerformers();
    }

    selectPerformer(id: number, username: string){
        this.selectedid = id;
        this.selectedusername = username;
        this.selectedperf = [];
    }

    filterPerformers(){
        this.selectedperf = this.performers.filter((perf: any) => this.selectedusername.substr(0,4) === perf.username.substr(0,4));
        console.log(this.selectedperf);
    }

    async loadPerformers() {
        const performersResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/usernames`, {
            credentials: 'include'
        });

        this.performers =  await performersResults.json();
    }

    async sendMessage(){
        const user: User = this.$store.state.authentication.user;

        let message = {
            clientid: { id: user.id },
            content: this.message.content,
            performer_account: { id: this.selectedid },
            sent_by: "CLIENT",
            status: "INBOX",
            subject: this.message.subject
        };

        const newmessageResult = await fetch(`${config.BaseUrl}/performer/performer_account/${this.selectedid}/email`, {
            method: 'POST',
            body: JSON.stringify(message),
            credentials: 'include'
        });

        if(!newmessageResult.ok){
            //Show error message
            return;
        }
    }


}