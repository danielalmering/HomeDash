import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../../models/User';

import config from '../../../../../config';
import WithRender from './newmessage.tpl.html';

interface MessageForm {
    subject: string;
    content: string;
}

interface BarePerformer {
    id: number;
    username: string;
    advertNumber:string;
    avatar:string;
}

function randAdv():string{
    let result = "0000".split(""); 
    for(let k=0; k<result.length; k++){
        result[k] = Math.floor( Math.random() * 10).toString();
    }
    return result.join("");
}

@WithRender
@Component
export default class Newmessage extends Vue {

    message: MessageForm = { subject: '', content: '' };

    performers: BarePerformer[] = []; //This call returns performer id's, not adverts... include adverts lol
    performerSearchQuery: string = '';
    selectedPerformer: number = 0;

    //accept-img.thuis.nl/files/pimg/
    imageUrl = config.ImageUrl;

    async mounted(){
        await this.loadPerformers();

        if(this.$route.params.advertId){
            this.selectedPerformer = parseInt(this.$route.params.advertId);
            let performer = this.performers.find( p => p.id == this.selectedPerformer );
            if (!performer) return;
            this.performerSearchQuery = `${performer.username} (${performer.advertNumber})`
        }
    }

    selectPerformer(performer:BarePerformer){
        this.selectedPerformer = performer.id;
        this.performerSearchQuery = `${performer.username} (${performer.advertNumber})`
    }

    get performersFilter(){
        if(this.performerSearchQuery === ''){
            return [];
        }

        var terms = this.performerSearchQuery.toLowerCase().trim().split(" ");
        return this.performers.filter( performer=>{
            const search = `${performer.username.toLowerCase()} (${performer.advertNumber})`;
            for(var term of terms){
                if (search.indexOf(term)==-1){
                    return false;
                }
            }
            return true;
        }).slice(0, 10);
    }

    async loadPerformers() {
        const performersResults = await fetch(`${config.BaseUrl}/performer/performer_accounts/usernames`, {
            credentials: 'include'
        });

        this.performers =  await performersResults.json();
        //stop doing this when Ljuba fixes the api call
        this.performers.forEach( value => {
            value.advertNumber = randAdv();
            value.avatar = "1.jpg";
        });
    }

    async sendMessage(){
        const user: User = this.$store.state.authentication.user;

        if(!this.message.content || this.selectedPerformer === 0 || !this.message.subject){
            this.$store.dispatch('errorMessage', 'account.alerts.errorNewMessage');
            return;
        }

        const message = {
            clientid: { id: user.id },
            content: this.message.content,
            performer_account: { id: this.selectedPerformer },
            sent_by: 'CLIENT',
            status: 'INBOX',
            subject: this.message.subject
        };

        const newmessageResult = await fetch(`${config.BaseUrl}/performer/performer_account/${this.selectedPerformer}/email`, {
            method: 'POST',
            body: JSON.stringify(message),
            credentials: 'include'
        });

        if(newmessageResult.ok){
            this.$store.dispatch('successMessage', 'account.alerts.successNewMessage');
            this.message = { subject: '', content: '' };
        }

        this.performerSearchQuery = "";
    }

}