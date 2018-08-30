import { Component, Prop } from 'vue-property-decorator';
import { Route } from 'vue-router';
import Vue from 'vue';

import config from '../../../config';
import { getPaymentInfo, submitPayment } from 'sensejs/consumer/payment';

import './payment.scss';
import WithRender from './payment.tpl.html';

interface Package {
    id: number;
    price: number;
    quantity: number;
    subtitle: string;
    title: string;
}

interface PaymentMethod {
    abbr: string;
    addBonus: boolean;
    icons: string[];
    id: number;
    info: string;
    title: string;
    subTitle: string;
}

interface PromoData {
    active: boolean;
    code: string;
    credits: number;
    used: boolean;
}

interface Fee {
    amount: number;
    percentage: number;
}

@WithRender
@Component
export default class Payment extends Vue {

    packages: Package[] = [];
    selectedPackages: { [id: number]: number } = {};

    paymentMethods: PaymentMethod[] = [];
    selectedPayment: string = '';

    promoData?: PromoData = undefined;
    promoCode: string = '';
    promoCredits: number = 0;

    fees: Fee[] = [];

    async mounted(){
        await this.getInfo();

        this.loadCache();

        // Payment Failure message!
        if(this.$route.name === 'PaymentFailure'){
            const query = new URLSearchParams(window.location.search);
            if(query.has('info') === true){
                this.$store.dispatch('errorMessage', query.get('info'));
            } else {
                this.$store.dispatch('errorMessage', 'payment.alerts.errorPaymentFailure');
            }
            this.$router.replace({ path: '/payment/' });
        }
    }

    beforeDestroy(){
        this.storeCache();
    }

    async getInfo(){
        const { result, error } = await getPaymentInfo();

        if(error){
            return;
        }

        const data = result;

        this.packages = data.packages.slice().reverse();
        this.paymentMethods = data.payment_methods;

        //Initialize initial state of the selectedpackages like this because adding properties to an object
        //has bad change detection
        this.selectedPackages = this.packages.reduce((initialState: any, pack: Package) => {
            initialState[pack.id] = 0;
            return initialState;
        }, {});

        this.fees = data.fees.map((f: any) => {
            return {
                amount: f.amount,
                percentage: parseInt(f.percentage)
            };
        });
        this.promoData = data.promo;
    }

    private loadCache(){
        const paymentCacheString = window.localStorage.getItem(`${config.StorageKey}.payment-cache`);

        if(!paymentCacheString){
            return;
        }

        const paymentCache = JSON.parse(paymentCacheString);
        this.selectedPackages = paymentCache.packages;
        this.promoCode = paymentCache.promoCode;

        if(this.promoCode !== ''){
            this.verifyPromo();
        }
    }

    private storeCache(){
        window.localStorage.setItem(`${config.StorageKey}.payment-cache`, JSON.stringify({
            packages: this.selectedPackages,
            promoCode: this.promoCode
        }));
    }

    get info(){
        return this.$store.state.info;
    }

    get user(){
        return this.$store.state.authentication.user;
    }

    get package(){
        return (id: string) => {
            return this.packages.find(p => p.id === parseInt(id));
        };
    }

    get totalAmount(){
        return Object.keys(this.selectedPackages).reduce((total: number, key: string) =>  {
            const pack = this.packages.find(p => p.id === parseInt(key));
            const amount = this.selectedPackages[parseInt(key)];

            return total + (pack ? pack.price * amount : 0);
        }, 0);
    }

    get bonusAmount(){
        return (credits: number) => {
            const applicableBonus = this.fees.reduce((result, fee) => {
                if(credits >= fee.amount && fee.amount > result) {
                    result = fee.percentage;
                }

                return result;
            }, 0);

            return Math.floor(credits * (applicableBonus / 100)) + this.promoCredits;
        };
    }

    get nextBonus(){
        const nextBonus = this.fees.reduce<undefined | Fee>((result, fee) => {
            if(this.credits < fee.amount && (!result || fee.amount < result.amount)) {
                result = fee;
            }

            return result;
        }, undefined);

        return nextBonus;
    }

    get credits(){
        return Object.keys(this.selectedPackages).reduce((total: number, key: string) =>  {
            const pack = this.packages.find(p => p.id === parseInt(key));
            const amount = this.selectedPackages[parseInt(key)];

            return total + (pack ? pack.quantity * amount : 0);
        }, 0);
    }

    addPackage(pack: Package){
        this.selectedPackages[pack.id] += 1;

        this.storeCache();
    }

    selectPayment(paymentType: string){
        this.selectedPayment = paymentType;
    }

    clearSelection(id: number){
        this.selectedPackages[id] = 0;

        this.storeCache();
    }

    verifyPromo(){
        if(!this.promoData){
            return;
        }

        if(this.promoCode !== this.promoData.code){
            this.$store.dispatch('errorMessage', 'payment.alerts.errorIncorrectPromo');
            return;
        }

        if(this.promoData.used){
            this.$store.dispatch('errorMessage', 'payment.alerts.errorUsedPromo');
            return;
        }

        this.storeCache();
        this.promoCredits = this.promoData.credits;
        this.$store.dispatch('successMessage', 'payment.alerts.successCorrectPromo');
    }

    async submitPurchase(){
        if(this.credits === 0){
            this.$store.dispatch('errorMessage', 'payment.alerts.errorNoPackage');
            return;
        }

        if((this.totalAmount/100) > 1099){
            this.$store.dispatch('errorMessage', 'payment.alerts.errorToHighPurchase');
            return;
        }

        if(this.selectedPayment === ''){
            this.$store.dispatch('errorMessage', 'payment.alerts.errorNoPayment');
            return;
        }

        const { result, error } = await submitPayment(this.selectedPayment, this.credits, this.promoCode);

        if(result.free !== undefined){
            this.$store.dispatch('openMessage', {
                content: result.free ? 'payment.alerts.successFreePromo' : 'payment.alerts.errorFreePromo',
                class: result.free ? 'success' : 'error'
            });

            return;
        }

        if(result.form){
            const redirForm = document.createElement('form');
            redirForm.setAttribute('method', 'post');
            redirForm.setAttribute('name', 'redirform');
            redirForm.setAttribute('action', result.redirectURL);

            var i, input;
            for(i in result.form){
                input = document.createElement('input');
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', i);
                input.setAttribute('value', (<any>result.form)[i]);
                redirForm.appendChild(input);
            }

            document.getElementsByTagName('body')[0].appendChild(redirForm);
            redirForm.submit();

            return;
        }

        window.location.href = result.redirectURL;
    }
}