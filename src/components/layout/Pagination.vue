<template>
    <div class="pagination col-md-12">
        <div class="pagination__previous"><i v-if="showPrevious" v-on:click="previous" class="fa fa-arrow-left"></i></div>
        <div class="pagination__middle">{{ $t('pagination.pageOf', { page: currentPage, total: total }) }}</div>
        <div class="pagination__buttons" v-if="pageButtons">
            <div v-for="page in pages" :key="page" :class="{ highlight: page === currentPage }" v-on:click="setPage(page)">
                {{ page }}
            </div>
        </div>
        <div class="pagination__next"><i v-if="showNext" v-on:click="next" class="fa fa-arrow-right"></i></div>
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

<style lang="scss">

.pagination {
    border: 2px solid #f9f9f9;
    color: #808080;
    font-size: 12px;
    font-weight: 700;
    padding: 0;

    &__middle {
        float: left;
        width: 25%;
        text-align: center;
        padding: 10px;
        margin: 0;
        height: 37px;
    }

    &__previous {
        float: left;
        width: 25%;
        cursor: pointer;
        height: 37px;
        .fa { float: left; }
    }

    &__next {
        float: left;
        width: 25%;
        cursor: pointer;
        height: 37px;
        .fa { float: right; }
    }

    &__buttons {
        float: left;
        width: 25%;

        div {
            float: left;
            margin: 10px;
        }

        .highlight {
            color: green;
        }
    }

    .fa {
        display: table;
        height: 100%;
        padding: 10px;
        width: auto;
    }
}

</style>
