import Vue, { ComponentOptions } from 'vue';
import { Location } from 'vue-router';

declare module "vue/types/options" {

    interface ComponentOptions<V extends Vue> {
        $localize?: (location: Location) => Location;
    }
}

declare module "vue/types/vue" {

    interface Vue {
        $localize: (location: Location) => Location;
    }
}