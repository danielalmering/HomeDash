import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { User } from '../../../../models/User';

@Component({
    template: require('./editdata.tpl.html')
})
export default class Editdata extends Vue {
    
    user: User;

    async updateUser(){
        const userResult = await fetch(`https://www.thuis.nl/api/client/client_accounts/${this.user.id}`, {
            method: 'PUT',
            body: JSON.stringify(this.user),
            credentials: 'include'
        });

        if(!userResult.ok){
            //Show error message
            return;
        }

        const userData = await userResult.json();

        this.$store.commit('setUser', userData);
    }

    created(){
        this.user = Object.assign({}, this.$store.state.authentication.user);
    }
}