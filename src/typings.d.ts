declare module "*.vue" {
    import Vue from 'vue';
    export default Vue;
}

declare module '*.html' {
    import Vue, { ComponentOptions } from 'vue';
    interface WithRender {
      <V extends Vue>(options: ComponentOptions<V>): ComponentOptions<V>
      <V extends typeof Vue>(component: V): V
    }
    const withRender: WithRender
    export = withRender
}

declare module "*.json" {
    const value: any;
    export default value;
}

declare module "raven-js/plugins/vue" {
    import { RavenPlugin } from 'raven-js';

    const plugin: RavenPlugin;
    export default plugin;
}

interface Window {
    flashCallbacks: any;
    flashCheckCallback():void;

    _pcq: any[]; //Pushcrew actions
    pushcrew: any;

    loadTagManager: any;

    hj: (action: string, path: string) => void;
}