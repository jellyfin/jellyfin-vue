<template>
  <component
    :is="props.group ? TransitionGroup : Transition"
    class="j-transition"
    v-bind="mergeProps($props, $attrs)"
    :name="prefersNoMotion || disabled || (isSlow && !important) ? undefined : `j-transition-${props.name}`">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { Transition, TransitionGroup, type TransitionProps, mergeProps } from 'vue';
import { prefersNoMotion, isSlow } from '@/store';

export interface JTransitionProps extends BetterOmit<TransitionProps, 'name'> {
  name?: 'fade' | 'rotated-zoom' | 'slide-y' | 'slide-y-reverse' | 'slide-x' | 'slide-x-reverse';
  /**
   * Transition group props
   */
  tag?: string;
  moveClass?: string;
  /**
   * JTransition custom props
   */
  group?: boolean;
  disabled?: boolean;
  /**
   * Run the transition even on low FPS scenarios
   */
  important?: boolean;
}

const props = withDefaults(defineProps<JTransitionProps>(), { name: 'fade', group: undefined, disabled: undefined });
</script>

<!-- TODO: Set scoped and remove .j-transition* prefix after: https://github.com/vuejs/core/issues/5148 -->

<style>
.j-transition {
  transition-duration: .3s !important;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
  transform-origin: center !important;
}

/** fade */
.j-transition-fade-enter-from,
.j-transition-fade-leave-to {
  opacity: 0 !important;
}

.j-transition-fade-enter-active,
.j-transition-fade-leave-active {
  transition-property: opacity !important;
  will-change: opacity !important;
}

/** rotated-zoom */
.j-transition-rotated-zoom-enter-from,
.j-transition-rotated-zoom-leave-to {
  transform: scale(0) rotate(-45deg);
}

.j-transition-rotated-zoom-enter-active,
.j-transition-rotated-zoom-leave-active {
  transition-property: transform !important;
  will-change: transform !important;
}

/** slide-* common classes */
.j-transition-slide-x-reverse-enter-active,
.j-transition-slide-x-reverse-leave-active,
.j-transition-slide-y-reverse-enter-active,
.j-transition-slide-y-reverse-leave-active,
.j-transition-slide-x-enter-active,
.j-transition-slide-x-leave-active,
.j-transition-slide-y-enter-from,
.j-transition-slide-y-leave-to {
  transition-property: transform, opacity !important;
}

/** slide-y */
.j-transition-slide-y-enter-from,
.j-transition-slide-y-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

/** slide-y-reverse */
.j-transition-slide-y-reverse-enter-from,
.j-transition-slide-y-reverse-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

/** slide-x-reverse */
.j-transition-slide-x-reverse-enter-from,
.j-transition-slide-x-reverse-leave-to {
  opacity: 0;
  transform: translateX(15px);
}

/** slide-x */
.j-transition-slide-x-enter-from,
.j-transition-slide-x-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}
</style>
