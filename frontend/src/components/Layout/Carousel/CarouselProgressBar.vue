<template>
  <div class="progress-bar-container">
    <div
      v-for="i in pages"
      :key="`progress-key-${i}`"
      :class="useResponsiveClasses('progress-bar uno-cursor-pointer')"
      @click.capture="emit('progressClicked', i - 1)">
      <div
        :class="useResponsiveClasses(barClasses[i - 1])"
        @animationend="emit('animationEnd')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useResponsiveClasses } from '@/composables/use-responsive-classes';

const { pages, currentIndex, duration, paused, hoverable } = defineProps<{
  pages: number;
  currentIndex: number;
  /**
   * In milliseconds
   */
  duration: number;
  paused: boolean;
  hoverable?: boolean;
}>();

const emit = defineEmits<{
  animationEnd: [];
  progressClicked: [index: number];
}>();

const display = useDisplay();

const defaultBarClasses = Object.freeze([
  'progress',
  'd-flex',
  'align-center',
  'justify-center'
]);
const expand = computed(() => hoverable && !display.mobile.value);
const animDuration = computed(() => (duration / 1000).toString() + 's');
const barClasses = computed(() =>
  Array.from({ length: pages }).map((_, i) => {
    const classes = [...defaultBarClasses];

    if (expand.value) {
      classes.push('expand');
    }

    if (i === currentIndex) {
      classes.push('active');

      if (paused) {
        classes.push('paused');
      }
    } else if (i < currentIndex) {
      classes.push('passed');
    }

    return classes.join(' ');
  })
);
</script>

<style scoped>
.progress-bar-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 0;
  margin: 10px 0;
  overflow: hidden;
  justify-content: center;
}

.progress-bar {
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
}

.progress-bar:hover .expand.progress {
  height: 10px !important;
  transition: height 0.25s;
  border-radius: 2px;
}

.progress {
  height: 2px;
  transition: height 0.25s;
  flex-grow: 1;
  border-radius: 4px;
  margin: 0 3px;
  display: block;
  background-image: linear-gradient(
    to right,
    rgba(var(--v-border-color), 1) 0%,
    rgba(var(--v-border-color), 1) 50%,
    rgba(var(--v-border-color), 0.3) 50.001%,
    rgba(var(--v-border-color), 0.3) 100%
  );
  background-repeat: no-repeat;
  background-size: 200%;
  background-color: #666;
  background-position: 100% 50%;
  animation-timing-function: linear;
  animation-delay: 0s;
  animation-fill-mode: forwards;
  animation-duration: v-bind(animDuration);
}

.progress.active {
  animation-name: Loader;
}

.progress.passed {
  background-position: 0 0;
}

.progress.paused {
  animation-play-state: paused;
}

@keyframes Loader {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: 0 0;
  }
}
</style>
