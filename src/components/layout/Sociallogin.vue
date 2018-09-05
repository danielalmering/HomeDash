<template>
    <div class="sociallogin" v-if="this.user">
        <div class="container-fluid">
            <p class="sociallogin__title"><span>{{ $t(title) }}</span></p>
            <a class="sociallogin__button fb" v-bind:href="socialdata['2'].href">Facebook</a>
            <!-- <a class="sociallogin__button tw" v-bind:href="socialhref('tw')">Twitter</a>
            <a class="sociallogin__button go" v-bind:href="socialhref('go')">Google</a> -->
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import config from '../../config';
import { Route } from 'vue-router';

import { Component, Prop } from 'vue-property-decorator';

@Component
export default class Sociallogin extends Vue {

    @Prop({
        required: false,
        type: String
    })
    title: string;

    socialdata: any = {
        '2': { 
            app: ['622011177968263', '674396449594035'], 
            href: `https://www.facebook.com/v3.1/dialog/oauth?client_id={appid}&redirect_uri=` + encodeURIComponent(`${location.protocol}//${location.host}/login/`) + `&state=2`,
            },
        '3': {},
        '4': {}
    };

    get user(){
        return this.$store.state.authentication.user; 
    }

    mounted(){
        this.setAPPID();
        this.loginredirect();
    }

    setAPPID(){
        for(const social in this.socialdata){
            let id = 0;
            if(!this.socialdata[social].app && !this.socialdata[social].href){ return; }
            if(config.FullApiUrl.includes('thuis')){    id = this.socialdata[social]['app']['0'];  }
            if(config.FullApiUrl.includes('zuhause')){  id = this.socialdata[social]['app']['1'];  }
            this.socialdata[social].href = this.socialdata[social].href.replace('{appid}', id); 
        }
    }

    async loginredirect(){
        const query = new URLSearchParams(window.location.search);
        const login = query.get('state');
        const token = query.get('code');

        if(!login){ return; }

        let link    = new URL(this.socialdata[login].href);
        let params  = new URLSearchParams(link.search);
        let url     = params.get('redirect_uri');
        let appid   = params.get('client_id');

        const checkSessionResult = await fetch(`${config.BaseUrl}/check_session?login=${login}&app=${appid}&ret=` + encodeURIComponent(`${url}`) + `&token=${token}`, {
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
</script>