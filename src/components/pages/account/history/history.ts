import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';

import Pagination from '../../../layout/Pagination.vue';

import config from '../../../../config';
import WithRender from './history.tpl.html';
import { getConsumerHistory } from 'SenseJS/consumer/consumer';
import { ConsumerHistoryItem } from 'SenseJS/core/models/user';

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

@WithRender
@Component({
    components: {
        pagination: Pagination
    }
})
export default class History extends Vue {

    history: ConsumerHistoryItem[] = [];
    total: number = 0;
    services: string[] = [];

    query = {
        limit: 20,
        offset: 0,
        filter: '',
        startDate: '',
        endDate: ''
    };

    get combinedQuery(){
        return this.query.filter + this.query.startDate + this.query.endDate;
    }

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

    @Watch('combinedQuery', { deep: true })
    onFilterChange(){
        this.query.offset = 0;
        this.loadHistory();
    }

    async loadHistory(){
        const userId = this.$store.state.authentication.user.id;

        const startDate = this.query.startDate !== '' ? new Date(`${this.query.startDate}T00:00:00.000Z`).getTime() / 1000 : undefined;
        const endDate = this.query.endDate !== '' ? new Date(`${this.query.endDate}T00:00:00.000Z`).getTime() / 1000 : undefined;

        const { result, error } = await getConsumerHistory(userId, {
            ...this.query,
            startDate: startDate,
            endDate: endDate
        });

        if(error){
            return;
        }

        this.history = result.history;
        this.total = result.total;
    }
}