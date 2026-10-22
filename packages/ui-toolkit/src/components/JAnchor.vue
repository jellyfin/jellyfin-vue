<template>
  <template v-if="isSupported">
    <JSlot
      :style="{
        'anchor-name': anchorName,
      }">
      <slot />
    </JSlot>
    <!--
      appear and persisted always take precedence over the passed props:
      - appear: content that is open from the start must also be shown (and promoted to the top layer)
      - persisted: the content is toggled with v-show, so the transition hooks must only run when it changes.
        Vue's template compiler only adds it when the built-in <Transition> and its v-show child are in the
        same template, which isn't the case through JTransition (it's part of Vue's BaseTransitionProps)

      Unless it's rendered in place, the content is in the top layer, so it escapes the overflow, transforms and
      stacking contexts of the anchor's ancestors. Like Vuetify's overlays, it only flips to the opposite side when
      it doesn't fit, shifting inside the available area otherwise.
    -->
    <JTransition
      v-bind="transitionProps"
      appear
      persisted
      @enter="show"
      @after-leave="hide">
      <span
        v-show="open"
        :popover="inPlace ? undefined : 'manual'"
        class="uno-[position-try-fallbacks:flip-block,flip-inline]"
        :class="{ 'uno-absolute': inPlace }"
        :style="{
          'position-anchor': anchorName,
          // eslint-disable-next-line css/no-unknown-property
          'position-area': position,
          'margin': `${offset}px`,
        }"
        v-bind="$attrs">
        <slot name="content" />
      </span>
    </JTransition>
  </template>
  <slot v-else />
</template>

<script lang="ts">
/**
 * position-area is the newest feature used here: every engine that supports it also
 * supports anchor-name, position-try-fallbacks and the Popover API
 */
const isSupported = CSS.supports('position-area', 'bottom');
</script>

<script setup lang="ts">
import { useId } from 'vue';
import JSlot from './JSlot.vue';
import JTransition, { type JTransitionProps } from './JTransition.vue';
import type { JAnchorProps } from '#/types.d.ts';

defineOptions({ inheritAttrs: false });

const { position = 'bottom', open, offset = 0, inPlace, transitionProps } = defineProps<JAnchorProps & {
  /**
   * Props of the JTransition used to show and hide the content. When omitted, JTransition's
   * defaults are used. Pass `{ disabled: true }` to show and hide the content instantly.
   */
  transitionProps?: JTransitionProps;
}>();
const anchorName = `--${useId()}`;

const show = (el: Element) => {
  if (!inPlace) {
    (el as HTMLElement).showPopover();
  }
};

/**
 * The popover is hidden once the leave transition finishes, so it stays in the top layer while fading out
 */
const hide = (el: Element) => {
  if (!inPlace) {
    (el as HTMLElement).hidePopover();
  }
};
</script>
