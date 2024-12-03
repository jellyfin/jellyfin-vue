import { mergeProps } from 'vue';

/**
 * Gets the base props for every component.
 */
export const getBaseProps = (attrs: Record<string, unknown>) => mergeProps(attrs, {
  'role': attrs.onClick ? 'button' : undefined,
  'aria-hidden': !!attrs.onClick,
  'tabindex': attrs.onClick ? 0 : undefined
});
