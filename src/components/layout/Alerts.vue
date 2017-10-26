<template>
    <div class="alerts">
        <div v-for="alert in alerts" :key="alert.id" class="alerts__alert">
            {{alert.content}}
        </div>
    </div>
</template>

<script>
import Vue from 'vue';

export default {
    name: 'alerts',
    data () {
        return {
        };
    },
    methods: {
        
    },
    computed: {
        alerts: function(){
            return this.$store.state.alerts.messages;
        }
    }
};
</script>

<style scoped lang="scss">
.alerts {
    position: fixed;
    z-index: 999;
    right: 0;
    bottom: 0;
    background-color: red;
    width: 100px;

    &__alert {
        background-color: green;
        color: red;
    }
}
</style>
