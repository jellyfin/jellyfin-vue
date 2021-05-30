import Vue from 'vue';

Vue.directive('hide', (el, binding) => {
  if (el) {
    if (binding.value === true) {
      el.style.opacity = '0';
    } else {
      el.style.opacity = '1';
    }
  }
});
