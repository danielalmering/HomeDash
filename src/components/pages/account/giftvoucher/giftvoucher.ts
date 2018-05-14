import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import config, { voucher } from '../../../../config';
import WithRender from './giftvoucher.tpl.html';
import { activateVoucher } from 'sensejs/consumer/payment';

@WithRender
@Component
export default class Giftvoucher extends Vue {
    voucherCode: string = '';
    voucher = voucher;

    async activateVoucher(){
        const user = this.$store.state.authentication.user;
        const voucherCode = this.voucherCode.toUpperCase();

        const { error } = await activateVoucher(user.id, this.voucherCode);

        if(error){
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