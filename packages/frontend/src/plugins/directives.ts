import type { DirectiveBinding } from 'vue';

/**
 * Toggles the CSS 'visibility' property of an element.
 */
export function hideDirective(
  element: HTMLElement | undefined,
  binding: DirectiveBinding<boolean>
): void {
  if (element) {
    element.style.visibility = binding.value ? 'hidden' : 'visible';
  }
}
