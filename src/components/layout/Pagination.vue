<template>
    <div class="pager col-md-12">
        <div class="pager__page hidden-xs col-sm-3">{{ $t('pagination.pageOf', { page: currentPage, total: totalPages }) }}</div>
        <div class="pager__numbers col-xs-12 col-sm-6">
            <div class="pager__numbers-items">
                <div class="pager__numbers-item" v-if="showPrevious" v-on:click="previous"><i class="fa fa-arrow-left"></i></div>
                <span v-if="pageButtons">
                    <div class="pager__numbers-item" v-for="page in pages" :key="page" :class="{ active: page === currentPage }" v-on:click="setPage(page)">
                        {{ page }}
                    </div>
                </span>
                <div class="pager__numbers-item" v-if="showNext" v-on:click="next"><i class="fa fa-arrow-right"></i></div>
            </div>
        </div>
        <div class="pager__quantity hidden-xs col-sm-3" v-if="pageCount">
            <span v-t="'pagination.amountPerPage'"></span>
            <select v-model="updatedLimit">
                <option value="40">40</option>
                <option value="80">80</option>
                <option value="120">120</option>
            </select>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';

export default {
    name: 'pagination',
    props: {
        limit: {
            required: true,
            type: Number
        },
        offset: {
            required: true,
            type: Number
        },
        total: {
            required: true,
            type: Number
        },
        pageButtons: {
            default: false,
            type: Boolean
        },
        pageCount: {
            default: false,
            type: Boolean
        },
        buttonsAhead: {
            default: 2,
            type: Number
        },
        buttonsBack: {
            default: 2,
            type: Number
        }
    },

    data () {
        return {
            updatedLimit: 40
        };
    },
    methods: {
        next: function(){
            this.$emit('update:offset', this.offset + this.limit);
            this.$emit('pageChange');
        },
        previous: function(){
            this.$emit('update:offset', this.offset - this.limit);
            this.$emit('pageChange');
        },
        setPage: function(page){
            this.$emit('update:offset', (page - 1) * this.limit);
            this.$emit('pageChange');
        }
    },
    watch: {
        updatedLimit: function(limit){
            const currentPage = Math.floor((this.offset / limit));

            console.log(currentPage);

            this.$emit('update:limit', parseInt(limit));
            this.$emit('update:offset', currentPage * limit);
            this.$emit('pageChange');
        }
    },
    computed: {
        showPrevious: function(){
            return this.offset > 0;
        },
        showNext: function(){
            return this.total > (this.offset + this.limit);
        },
        currentPage: function(){
            return (this.offset / this.limit) + 1;
        },
        totalPages: function(){
            return Math.ceil(this.total / this.limit);
        },
        pages: function(){
            const pages = [this.currentPage];

            for(var i = 1; i <= this.buttonsBack; i++){
                let page = this.currentPage - i;

                if(page < 1){
                    break;
                }

                pages.unshift(page);
            }

            for(var i = 1; i <= this.buttonsAhead; i++){
                let page = this.currentPage + 1;

                if(page > this.totalPages){
                    break;
                }

                pages.push(this.currentPage + i);
            }


            return pages;
        }
    }
};
</script>
