import Vue from 'vue';
import { VNode, VNodeDirective } from 'vue/types/vnode';

Vue.directive('scroll', {
    inserted: function(el: HTMLElement, binding: VNodeDirective){
        const f = function (evt: any) {
            if(binding.value(evt, el)) {
                window.removeEventListener('scroll', f);
            }
        };
        window.addEventListener('scroll', f);
    }
});