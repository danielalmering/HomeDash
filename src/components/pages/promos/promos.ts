import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

@Component({
    template: require('./promos.tpl.html')
})
export default class Promo extends Vue {

    promos: any[] = [];
    promoslist: any[] = [];

    mounted(){
        this.loadPromos();
    }

    async loadPromos(){
        const promosResult = await fetch(`https://www.thuis.nl/api/cms/account`, {
            credentials: 'include'
        });

        if(!promosResult.ok){
            return; //TODO: Display error
        }

        this.promos = await promosResult.json();

        let positionId = 1;
        this.promoslist = this.promos.filter((promo: any) => promo.position === positionId);
        this.promos = this.promoslist;

    }

}