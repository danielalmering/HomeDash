<template>
    <div id="app">
        <modal-wrapper></modal-wrapper>
        <router-view/>
        <alerts></alerts>
    </div>
</template>

<script language="ts">
import modalWrapper from './components/modal/modal-wrapper';
import notificationSocket from './socket';
import alerts from './components/layout/Alerts';

export default {
    components: {
        modalWrapper: modalWrapper,
        alerts: alerts
    },
    name: 'app',
    created: function(){
        this.$store.dispatch('getSession').then(() => {
            notificationSocket.connect();
        });

        this.$store.dispatch('loadInfo');

        this.$store.dispatch('openMessage', {
            content: 'Welkom op het nieuwe thuis',
            translate: false
        });
    }
};
</script>

