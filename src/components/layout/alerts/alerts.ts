import { Component, Vue } from 'vue-property-decorator';
import './alerts.scss';
import WithRender from './alerts.tpl.html';

@WithRender
@Component
export default class Alerts extends Vue {

    get alerts(){
        return this.$store.state.alerts.messages;
    }

}

