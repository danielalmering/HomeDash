declare module "*.vue" {
    import Vue from 'vue';
    export default Vue;
}

// declare module "vue/types/vue" {
//     import { Store } from 'vuex';
//     import { RootState } from './store';

//     interface Vue {
//         $store: Store<RootState>;
//     }
// }

interface Window {
    flashCallbacks: any;
    _pcq: any[];
}