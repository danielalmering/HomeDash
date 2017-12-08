import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../config';
import JSMpeg from '../videochat/streams/jsmpeg';

import './voyeur.scss';

@Component({
    template: require('./voyeur.tpl.html'),
    components: {
        jsmpeg: JSMpeg
    }
})
export default class Voyeur extends Vue {

    intervalTimer: number;

    get mainTile(){
        return this.$store.state.voyeur.mainTile;
    }

    get favoritePerformers(){
        return this.$store.getters['voyeur/favourites'];
    }

    get performer(){
        return (id: number) => {
            console.log(this.$store.getters['voyeur/performer']);
            console.log(id);
            console.log(this.$store.getters['voyeur/performer'](id));
            return this.$store.getters['voyeur/performer'](id);
        }
    }

    mounted(){
        this.intervalTimer = setInterval(async () => {
            await fetch(`${config.BaseUrl}/session/client_seen?app=VOYEUR`, { credentials: 'include' });
        }, 1000);

        if(!this.$store.state.voyeur.isActive){
            this.$router.push({
                name: 'Profile',
                params: {
                    id: this.$route.params.id
                }
            })
        }
    }

    beforeDestroy(){
        clearInterval(this.intervalTimer);

        if(!this.$store.state.voyeur.isActive){
            return;
        }

        //Kill session
        this.$store.dispatch('voyeur/end');
    }

    viewerStateChange(state: string){
        console.log(`yoyo dit is de state: ${state}`);
    }

    viewerError(message: string){
        console.log(message);
    }
}