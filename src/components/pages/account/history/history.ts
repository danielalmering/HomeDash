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
        filter: ''
    };

    mounted(){
        this.loadHistory();

        // Load in a list of all services
        for(const item in Service){
            this.services.push(Service[item]);
        }
    }

    pageChanged(){
        this.loadHistory();
    }

    @Watch('query.filter')
    onFilterChange(){
        this.loadHistory();
    }

    async loadHistory(){
        const historyResult = await fetch(`${config.BaseUrl}/client/client_accounts/5789/history?limit=${this.query.limit}&offset=${this.query.offset}&filter=${this.query.filter}`, {
            credentials: 'include'
        });

        if(!historyResult.ok){
            return; //TODO: Display error
        }

        const data = await historyResult.json();

        this.history = data.history;
        this.total = parseInt(data.total);
    }
}