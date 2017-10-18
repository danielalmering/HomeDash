<template>
    <div id="app">
        <router-view/>

        <modal-wrapper></modal-wrapper>
    </div>
</template>

<script>
import modalWrapper from './components/modal/modal-wrapper';

export default {
    components: {
        modalWrapper: modalWrapper
    },
    name: 'app'
};
</script>

