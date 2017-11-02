import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../../config';

@Component({
    template: require('./giftvoucher.tpl.html')
})
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
                content: 'account.voucher.errorMessage',
                class: 'error'
            });

            return;
        }

        this.$store.dispatch('openMessage', {
            content: 'account.voucher.successMessage',
            class: 'success'
        });
    }
}