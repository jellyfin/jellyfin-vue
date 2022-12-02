<template>
  <div class="progress-bar-container">
    <div
      v-for="i in pages"
      :key="`progress-key-${i}`"
      :class="useResponsiveClasses('progress-bar')"
      @click.capture="onProgressClicked(i)">
      <div
        ref="progress"
        :class="
          expand
            ? useResponsiveClasses(
                'progress d-flex align-center justify-center expand'
              )
            : useResponsiveClasses(
                'progress d-flex align-center justify-center'
              )
        " />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useResponsiveClasses } from '@/composables';

export default defineComponent({
  props: {
    pages: {
      type: Number,
      required: true
    },
    currentIndex: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    paused: {
      type: Boolean,
      required: true,
      default: false
    },
    hoverable: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup() {
    return { useResponsiveClasses };
  },
  data() {
    return {
      bars: [] as HTMLElement[]
    };
  },
  computed: {
    expand(): boolean {
      return this.hoverable && !this.$vuetify.display.mobile;
    }
  },
  watch: {
    currentIndex(): void {
      this.$nextTick(() => {
        window.requestAnimationFrame(this.updateBars);
      });
    },
    paused(): void {
      this.$nextTick(() => {
        window.requestAnimationFrame(this.togglePause);
      });
    },
    duration(): void {
      this.$nextTick(() => {
        window.requestAnimationFrame(this.setAnimationDuration);
      });
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.bars = this.$refs.progress as Array<HTMLElement>;
      window.requestAnimationFrame(this.setAnimationDuration);
      window.requestAnimationFrame(this.updateBars);
    });
  },
  unmounted() {
    const animEndFunction = this.onAnimationEnd;

    this.bars.forEach((element: HTMLElement) => {
      element.removeEventListener('animationend', animEndFunction);
    });
  },
  methods: {
    updateBars(): void {
      const followingBars = this.bars.slice(this.currentIndex + 1);
      const previousBars = this.bars.slice(0, this.currentIndex);
      const activeBar = this.bars[this.currentIndex];
      const animEndFunction = this.onAnimationEnd;

      if (activeBar) {
        activeBar.classList.add('active');
        activeBar.addEventListener('animationend', animEndFunction);
      }

      if (previousBars) {
        window.requestAnimationFrame(() => {
          previousBars.forEach((element: HTMLElement) => {
            element.classList.remove('active', 'paused');
            element.removeEventListener('animationend', animEndFunction);
            element.classList.add('passed');
          });
        });
      }

      if (followingBars) {
        window.requestAnimationFrame(() => {
          followingBars.forEach((element: HTMLElement) => {
            element.classList.remove('active', 'passed', 'paused');
            element.removeEventListener('animationend', animEndFunction);
          });
        });
      }
    },
    onAnimationEnd(): void {
      this.$emit('on-animation-end');
    },
    onProgressClicked(index: number): void {
      this.$emit('on-progress-clicked', index - 1);
    },
    togglePause(): void {
      if (this.paused) {
        this.bars[this.currentIndex].classList.add('paused');
      } else {
        this.bars[this.currentIndex].classList.remove('paused');
      }
    },
    setAnimationDuration(): void {
      const newDuration = (this.duration / 1000).toString() + 's';

      this.bars.forEach((element: HTMLElement) => {
        element.style.animationDuration = newDuration;
      });
    }
  }
});
</script>

<style lang="scss" scoped>
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
  cursor: pointer !important;
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
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 1) 50%,
    rgba(255, 255, 255, 0.3) 50.001%,
    rgba(255, 255, 255, 0.3) 100%
  );
  background-repeat: no-repeat;
  background-size: 200%;
  background-color: #666;
  background-position: 100% 50%;
  animation-timing-function: linear;
  animation-delay: 0s;
  animation-fill-mode: forwards;
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
