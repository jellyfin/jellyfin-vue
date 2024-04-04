<template>
  <component
    :is="getComponent()"
    class="j-transition"
    v-bind="mergeProps($props, $attrs)">
     <slot />
  </component>
</template>

<script setup lang="ts">
import { Transition, TransitionGroup, type TransitionProps, type Component as VueComponent, mergeProps } from 'vue';
import JNoop from '@/components/lib/JNoop.vue';
import { prefersNoMotion } from '@/store';

/**
 * TODO: Investigate why not ignoring 'mode' makes the transition component not
 * to work correctly and the need to redeclare it.
 */
export interface JTransitionProps extends BetterOmit<TransitionProps, 'mode' | 'name'> {
  name?: 'fade' | 'rotated-zoom' | 'slide-y-reverse' | 'slide-x' | 'slide-x-reverse';
  mode?: 'in-out' | 'out-in' | 'default';
  /**
   * Transition group props
   */
  tag?: string;
  moveClass?: string;
  /**
   * JTransition custom props
   */
  group?: boolean
}

const props = withDefaults(defineProps<JTransitionProps>(), { name: 'fade' });

/**
 * Get the component to use based on props and the current motion preference
 */
function getComponent(): VueComponent {
  if (prefersNoMotion.value) {
    return JNoop;
  } else if (props.group) {
    return TransitionGroup;
  } else {
    return Transition;
  }
}
</script>

<style scoped>
.j-transition {
  transition-duration: .3s !important;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
  transform-origin: center !important;
}

/** fade */
.fade-enter-from,
.fade-leave-to {
  opacity: 0 !important;
}

.fade-enter-active,
.fade-leave-active {
  transition-property: opacity !important;
}

/** rotated-zoom */
.rotated-zoom-enter-from,
.rotated-zoom-leave-to {
  transform: scale(0) rotate(-45deg);
}

.rotated-zoom-enter-active,
.rotated-zoom-leave-active {
  transition-property: transform !important;
}

/** slide-y-reverse */
.slide-y-reverse-enter-from,
.slide-y-reverse-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

.slide-y-reverse-enter-active,
.slide-y-reverse-leave-active {
  transition-property: transform, opacity !important;
}

/** slide-x-reverse */
.slide-x-reverse-enter-from,
.slide-x-reverse-leave-to {
  opacity: 0;
  transform: translateX(15px);
}

.slide-x-reverse-enter-active,
.slide-x-reverse-leave-active {
  transition-property: transform, opacity !important;
}
/** slide-x */
.slide-x-enter-from,
.slide-x-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}

.slide-x-enter-active,
.slide-x-leave-active {
  transition-property: transform, opacity !important;
}
</style>
