import Vue from 'vue';

/**
 * Toggles the CSS 'visibility' property of an element.
 */
Vue.directive('hide', (el, binding) => {
  if (el) {
    if (binding.value === true) {
      el.style.visibility = 'hidden';
    } else {
      el.style.visibility = 'visible';
    }
  }
});
