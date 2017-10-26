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
            content: 'Heyy',
            displayTime: 1000000
        });

        this.$store.dispatch('openMessage', {
            content: 'Second Message',
            displayTime: 1000000
        });

        setTimeout(() => {

            this.$store.dispatch('openMessage', {
                content: 'Temporary Message'
            });
        }, 2000);
    }
};
</script>

