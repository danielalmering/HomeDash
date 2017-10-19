<template>
    <div id="app">
        <router-view/>

        <modal-wrapper></modal-wrapper>
    </div>
</template>

<script language="ts">
import modalWrapper from './components/modal/modal-wrapper';

export default {
    components: {
        modalWrapper: modalWrapper
    },
    name: 'app',
    created: function(){
        this.$store.dispatch('getSession');
        this.$store.dispatch('loadInfo');
    }
};
</script>

