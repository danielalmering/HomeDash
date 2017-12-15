import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import Pagination from '../../../layout/Pagination.vue';

import config from '../../../../config';

interface HistoryItem {
    date: number;
    amount: number;
    payment: number;
    service: string;
}

enum Service {
    Video       = 'VIDEO',
    VideoCall   = 'VIDEOCALL',
    Sms         = 'SMS',
    Purchase    = 'CREDIT_PURCHASE',
    Email       = 'EMAIL',
    Voicemail   = 'VOICEMAIL',
    Peek        = 'PEEK',
    Call        = 'IVR'
}

@Component({
    template: require('./history.tpl.html'),
    components: {
        pagination: Pagination
    }
})
export default class History extends Vue {

    history: HistoryItem[] = [];
    total: number = 0;
    services: string[] = [];

    query = {
        limit: 20,
        offset: 0,
        filter: '',
        startDate: '',
        endDate: ''
    };

    mounted(){
        this.loadHistory();

        // Load in a list of all services
        for(const item in Service){
            this.services.push(Service[item]);
        }
        this.services.push('VOYEURCLIENT'); //Gotta add voyeur manually
    }

    pageChanged(){
        this.loadHistory();
    }

    @Watch('query', { deep: true })
    onFilterChange(){
        this.loadHistory();
    }

    async loadHistory(){
        const userId = this.$store.state.authentication.user.id;

        const startDate = this.query.startDate !== '' ? new Date(`${this.query.startDate}T00:00:00.000Z`).getTime() / 1000 : '';
        const endDate = this.query.endDate !== '' ? new Date(`${this.query.endDate}T00:00:00.000Z`).getTime() / 1000 : '';

        const historyResult = await fetch(`${config.BaseUrl}/client/client_accounts/${userId}/history?limit=${this.query.limit}&offset=${this.query.offset}&filter=${this.query.filter}&startDate=${startDate}&endDate=${endDate}`, {
            credentials: 'include'
        });

        if(!historyResult.ok){
            return;
        }

        const data = await historyResult.json();

        this.history = data.history;
        this.total = parseInt(data.total);
    }
}