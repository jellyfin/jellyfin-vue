import Vue from 'vue';
// @ts-expect-error - target typing doesn't exist as we declared it in params.
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

Vue.component('DynamicScroller', DynamicScroller);
Vue.component('DynamicScrollerItem', DynamicScrollerItem);
