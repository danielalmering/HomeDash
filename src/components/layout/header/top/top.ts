import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import './top.scss';

@Component({
    template: require('./top.tpl.html')
})
export default class Top extends Vue {

    get logo(){
        return this.$store.getters.getLogoLight; 
    }

    get info(){
        return this.$store.state.info;
    }

    branding(){
        if(this.info.country != 'nl'){
            return false;
        }
        return true
    }

}