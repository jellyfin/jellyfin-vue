<template>
  <component
    :is="group ? TransitionGroup : VTransition"
    :duration="forcedDisable || disabled ? 0 : undefined"
    :enter-from-class
    :enter-active-class
    :leave-active-class="enterActiveClass"
    :leave-to-class="enterFromClass"
    v-bind="$attrs"
    @before-leave="(...args) => {
      leaving = true;
      // @ts-expect-error - Incorrect typings
      $attrs.onBeforeLeave?.(...args);
    }"
    @after-leave="(...args) => {
      onNoLeave();
      // @ts-expect-error - Incorrect typings
      $attrs.onAfterLeave?.(...args);
    }"
    @leave-cancelled="(...args) => {
      onNoLeave();
      // @ts-expect-error - Incorrect typings
      $attrs.onLeaveCancelled?.(...args);
    }">
    <!-- Transition only supports a single child, so we handle a possible misuse here wrapping if necessary -->
    <span v-if="$slots.default?.({})?.length > 1 && !group">
      <slot />
    </span>
    <slot v-else />
  </component>
</template>

<script lang="ts">
import { Transition, TransitionGroup, type TransitionProps, shallowRef, computed, type DefineComponent } from 'vue';
import { prefersNoMotion, isSlow } from '#/store';
import { usePausableEffect } from '#/composables/use-pausable-effect.ts';

interface Props {
  name?: 'fade' | 'rotated-zoom' | 'slide-y' | 'slide-y-reverse' | 'slide-x' | 'slide-x-reverse';
  /**
   * If the component needs to be rendered as a TransitionGroup
   */
  group?: boolean;
  /**
   * If the transition should be disabled
   */
  disabled?: boolean;
  /**
   * Don't stop patching the DOM while transitioning
   */
  skipPausing?: boolean;
}

export type JTransitionProps = TransitionProps & Props;
const forcedDisable = computed(() => prefersNoMotion.value || isSlow.value);
</script>

<script setup lang="ts">
const { name = 'fade', group, disabled, skipPausing } = defineProps<Props>();
// https://github.com/vuejs/language-tools/issues/4814#issuecomment-2336324561
const VTransition = Transition as unknown as DefineComponent<TransitionProps>;
const leaving = shallowRef(false);
const onNoLeave = () => leaving.value = false;

/* Equivalent to *-enter-from class */
const enterFromClass = computed(() => {
  switch (name) {
    case 'slide-x': {
      return '!-uno-translate-x-4 !uno-opacity-0';
    }
    case 'slide-x-reverse': {
      return '!uno-translate-x-4 !uno-opacity-0';
    }
    case 'slide-y': {
      return '!-uno-translate-y-4 !uno-opacity-0';
    }
    case 'slide-y-reverse': {
      return '!uno-translate-y-4 !uno-opacity-0';
    }
    case 'rotated-zoom': {
      return '!uno-scale-0 !uno-rotate-45';
    }
    case 'fade': {
      return '!uno-opacity-0';
    }
    default: {
      return;
    }
  }
});

/* Equivalent to *-enter-active class */
const baseTransform = '!uno-transform-origin-center !uno-transform-gpu';
const enterActiveClass = computed(() => {
  switch (name) {
    case 'slide-x-reverse':
    case 'slide-y-reverse':
    case 'slide-y':
    case 'slide-x': {
      return `!uno-transition-property-[opacity,transform] !uno-duration-default ${baseTransform}`;
    }
    case 'rotated-zoom': {
      return `!uno-transition-transform ${baseTransform}`;
    }
    case 'fade': {
      return '!uno-transition-opacity';
    }
    default: {
      return;
    }
  }
});

if (!skipPausing) {
  usePausableEffect(leaving);
}
</script>
