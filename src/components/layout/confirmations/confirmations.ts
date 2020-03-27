import { Prop, Vue, Component } from 'vue-property-decorator';

import WithRender from './confirmations.tpl.html';
import './confirmations.scss';

@WithRender
@Component
export default class Confirmations extends Vue {

    @Prop({
        required: true,
        type: String
    })
    type: string;

    @Prop({
        required: false,
        type: String
    })
    title: string;

    @Prop({
        required: false,
        type: String
    })
    subTitle: string;

    get displaySidebar(){
        return this.$store.state.displaySidebar;
    }

    mounted(){
        window.scrollTo(0, 0);
        if(this.displaySidebar){
            this.$store.commit('toggleSidebar');
        }
    }

    accept(){
        this.$emit('accept');
    }

    cancel(){
        this.$emit('cancel');
    }
}
