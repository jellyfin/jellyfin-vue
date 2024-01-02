import type Vue from 'vue';

/**
 * Toggles the CSS 'visibility' property of an element.
 */
export function hideDirective(
  element: HTMLElement,
  binding: Vue.DirectiveBinding<boolean>
): void {
  if (element) {
    element.style.visibility = binding.value === true ? 'hidden' : 'visible';
  }
}
