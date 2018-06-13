import Vue from 'vue';
import { VNode, VNodeDirective } from 'vue/types/vnode';

Vue.directive('scroll', {
    inserted: function(el: HTMLElement, binding: VNodeDirective){
        let f = function (evt: any) {
            if(binding.value(evt, el)) {
                    window.removeEventListener('scroll', f)
                }
            }
        window.addEventListener('scroll', f)
    }
});