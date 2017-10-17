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

<style>
body {
    margin: 0;
}

#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
}
</style>
