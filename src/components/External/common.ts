import Vue from 'vue';
import { ValidationProvider, ValidationObserver } from 'vee-validate';
import draggable from 'vuedraggable';
// @ts-expect-error - target typing doesn't exist as we declared it in params.
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

Vue.component('ValidationProvider', ValidationProvider);
Vue.component('ValidationObserver', ValidationObserver);
Vue.component('Draggable', draggable);
Vue.component('DynamicScroller', DynamicScroller);
Vue.component('DynamicScrollerItem', DynamicScrollerItem);
