import Vue from 'vue';
import { VNode, VNodeDirective } from 'vue/types/vnode';

Vue.directive('clickOutside', {
    bind: function (el: HTMLElement, binding: VNodeDirective) {
        const callback = binding.value.cb as () => void;
        const anyEl = el as any;

        anyEl.event = function (event : any) {
            const target = event.target as HTMLElement;

            if(binding.value.ignoreClass){
                const ignored = binding.value.ignoreClass as string[];
                const hasIgnored = ignored.some(i => target.classList.contains(i) || (target.parentElement !== null && target.parentElement.classList.contains(i)));
                if(hasIgnored){
                    return;
                }
            }

            callback();
        };
        document.body.addEventListener('click', anyEl.event);
    },
    unbind: function (el) {
        document.body.removeEventListener('click', (<any>el).event);
    }
});
