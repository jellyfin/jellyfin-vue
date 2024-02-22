<script lang="ts">
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import type { Arrayable } from '@vueuse/core';
import { cloneVNode, mergeProps, Fragment, type VNode } from 'vue';

/**
 * Render multiple child nodes from a slot, including nested fragments.
 */
function renderSlotFragments(children?: VNode[]): VNode[] {
  if (!children) {
    return [];
  }

  return children.flatMap((child) => {
    if (child.type === Fragment) {
      return renderSlotFragments(child.children as VNode[]);
    }

    return [child];
  });
}

export default {
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return (): Arrayable<VNode> | undefined => {

      if (!slots.default) {
        return;
      }

      const childrens = renderSlotFragments(slots.default());

      const [firstChildren, ...otherChildren] = childrens;

      if (Object.keys(attrs).length > 0) {
        // Remove props ref from being inferred
        delete firstChildren.props?.ref;

        const mergedProps = mergeProps(attrs, firstChildren.props ?? {});

        // Remove class to prevent duplicated
        if (attrs.class && firstChildren.props?.class) {
          delete firstChildren.props.class;
        }

        const cloned = cloneVNode(firstChildren, mergedProps);

        /*
         * Explicitly override props starting with `on`.
         * It seems cloneVNode from Vue doesn't like overriding `onXXX` props. So
         * we have to do it manually.
         */

        for (const prop in mergedProps) {
          if (prop.startsWith('on')) {
            cloned.props ||= {};
            cloned.props[prop] = mergedProps[prop];
          }
        }

        return childrens.length === 1 ? cloned : [cloned, ...otherChildren];
      }

      return childrens;
    };
  }
};
/* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
</script>
