<template>
    <div class="sociallogin" v-if="this.user">
        <div class="container-fluid">
            <p class="sociallogin__title"><span>{{ $t('modals.login.orsignupwith') }}</span></p>
            <a class="sociallogin__button fb" v-bind:href="socialhref('fb')">Facebook</a>
            <!-- <a class="sociallogin__button tw" v-bind:href="socialhref('tw')">Twitter</a>
            <a class="sociallogin__button go" v-bind:href="socialhref('go')">Google</a> -->
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import config from '../../config';
import { Route } from 'vue-router';

import { Component } from 'vue-property-decorator';

@Component
export default class Sociallogin extends Vue {

    get user(){
        return this.$store.state.authentication.user; 
    }

    get socialhref(){
        const href: any = {
            fb: `https://www.facebook.com/v3.1/dialog/oauth?client_id=674396449594035&redirect_uri=` + encodeURIComponent(`${location.protocol}//${location.host}/login/`) + `&state=acc${this.user.id}`,
            tw: ``,
            go: ``
        }

        return (name: string) => {
            return href[name];
        };
    }

    mounted(){
        this.loginredirect();
    }

    async loginredirect(){
        const query = new URLSearchParams(window.location.search);
        const redirect: any = {
            code: [ { 'url': encodeURIComponent(`${location.protocol}//${location.host}/login/`), 'login': 2 } ],
            tw: ``,
            go: ``
        };

        for (const q in redirect) {
            if(query.has(q) === true){
                const url    = redirect[q][0].url;
                const token  = query.get(q);
                const login  = redirect[q][0].login;

                const checkSessionResult = await fetch(`${config.BaseUrl}/check_session?login=${login}&ret=${url}&token=${token}`, {
                    credentials: 'include'
                });

                const data = await checkSessionResult.json();
                this.$store.commit('setUser', data);

                this.$store.dispatch('openMessage', {
                    content: 'auth.alerts.successlogin',
                    class: 'success',
                    translateParams: {
                        username: data.username
                    }
                });

                this.$store.dispatch('closeModal');
                this.$router.push({ name: 'Editdata' });
            }
        }
    }
}
</script>