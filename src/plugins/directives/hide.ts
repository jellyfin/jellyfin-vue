import Vue from 'vue';

Vue.directive('hide', (el, binding) => {
  if (el) {
    if (binding.value === true) {
      el.style.display = 'none';
    } else {
      el.style.display = 'initial';
    }
  }
});
