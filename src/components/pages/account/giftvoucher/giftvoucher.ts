import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../../config';
import WithRender from './giftvoucher.tpl.html';

@WithRender
@Component
export default class Giftvoucher extends Vue {
    voucherCode: string = '';

    async activateVoucher(){
        const user = this.$store.state.authentication.user;
        const voucherCode = this.voucherCode.toUpperCase();

        const voucherResult = await fetch(`${config.BaseUrl}/client/client_accounts/${user.id}/promo_credit/${voucherCode}`, {
            credentials: 'include'
        });

        if(!voucherResult.ok){
            this.$store.dispatch('openMessage', {
                content: 'account.alerts.errorVoucher',
                class: 'error'
            });

            return;
        }

        this.$store.dispatch('openMessage', {
            content: 'account.alerts.successVoucher',
            class: 'success'
        });
    }
}