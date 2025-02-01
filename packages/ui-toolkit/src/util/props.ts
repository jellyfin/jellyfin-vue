import { mergeProps } from 'vue';

/**
 * Checks if the component has a click handler (regardless of the modifiers used)
 */
function hasClickHandler(attrs: Record<string, unknown>) {
  for (const key in attrs) {
    if (key.startsWith('onClick')) {
      return true;
    }
  }

  return false;
}

/**
 * Gets the base props for every component.
 */
export function getBaseProps(attrs: Record<string, unknown>) {
  const hasClick = hasClickHandler(attrs);

  return mergeProps(attrs, {
    role: hasClick ? 'button' : undefined,
    tabindex: hasClick ? 0 : undefined
  });
};
