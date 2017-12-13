import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

import config from '../../../config';

import './payment.scss';

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

@Component({
    template: require('./payment.tpl.html')
})
export default class Payment extends Vue {

    packages: Package[] = [];
    selectedPackages: { [id: number]: number } = {};

    paymentMethods: PaymentMethod[] = [];
    selectedPayment: string = '';

    promoData?: PromoData = undefined;
    promoCode: string = '';
    promoCredits: number = 0;

    minimumBonusFee: number = 0;
    bonusPercentage: number = 0;

    async mounted(){
        await this.getInfo();

        this.loadCache();
    }

    beforeDestroy(){
        this.storeCache();
    }

    async getInfo(){

        const infoResults = await fetch(`${config.BaseUrl}/client/client_accounts/updatebalanceinfo`, {
            credentials: 'include'
        });

        const data = await infoResults.json();

        this.packages = data.packages;
        this.paymentMethods = data.payment_methods;

        //Initialize initial state of the selectedpackages like this because adding properties to an object
        //has bad change detection
        this.selectedPackages = this.packages.reduce((initialState: any, pack: Package) => {
            initialState[pack.id] = 0;
            return initialState;
        }, {});

        this.minimumBonusFee = data.fees[0].amount;
        this.bonusPercentage = data.fees[0].percentage;
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

    get package(){
        return (id: string) =>{
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
            return Math.floor(credits / this.minimumBonusFee) * (this.minimumBonusFee * (this.bonusPercentage / 100)) + this.promoCredits;
        };
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

        if(this.selectedPayment === ''){
            this.$store.dispatch('errorMessage', 'payment.alerts.errorNoPayment');
            return;
        }

        const paymentResult = await fetch(`${config.BaseUrl}/client/buy/${this.selectedPayment}/${this.credits}?promo=${this.promoCode}`, {
            credentials: 'include'
        });

        const data = await paymentResult.json();

        if(data.free !== undefined){
            this.$store.dispatch('openMessage', {
                content: data.free ? 'payment.alerts.successFreePromo' : 'payment.alerts.errorFreePromo',
                class: data.free ? 'success' : 'error'
            });

            return;
        }

        if(data.form){
            var redirForm = document.createElement('form');
            redirForm.setAttribute('method', 'post');
            redirForm.setAttribute('name', 'redirform');
            redirForm.setAttribute('action', data.redirectURL);

            var i, input;
            for(i in data.form){
                input = document.createElement('input');
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', i);
                input.setAttribute('value', data.form[i]);
                redirForm.appendChild(input);
            }

            document.getElementsByTagName('body')[0].appendChild(redirForm);
            redirForm.submit();

            return;
        }

        window.location.href = data.redirectURL;
    }
}