import Vue from 'vue';

/**
 * Toggles the CSS 'visibility' property of an element.
 */
export function hideDirective(
  el: HTMLElement,
  binding: Vue.DirectiveBinding<any>
) {
  if (el) {
    if (binding.value === true) {
      el.style.visibility = 'hidden';
    } else {
      el.style.visibility = 'visible';
    }
  }
}
