<template>
    <div id="app">
        <modal-wrapper></modal-wrapper>
        <router-view/>
    </div>
</template>

<script language="ts">
import modalWrapper from './components/modal/modal-wrapper';
import notificationSocket from './socket';

console.log(notificationSocket);

export default {
    components: {
        modalWrapper: modalWrapper
    },
    name: 'app',
    created: function(){
        this.$store.dispatch('getSession').then(() => {
            // this.$store.dispatch('socketConnect');
            notificationSocket.connect();
        });

        this.$store.dispatch('loadInfo');
    }
};
</script>

