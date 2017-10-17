<template>
    <div class="performer">
        <p>Performer {{id}}</p>
    </div>
</template>

<script lang="ts">
export default {
    name: 'Performer',
    data () {
        return {
            id: 0
        };
    },
    created: function(){
        let test: number = parseInt(this.$route.params.id);

        this.id = test;
    }
};
</script>

<style lang="scss">
</style>
