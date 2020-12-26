<template>
  <div class="progress-container">
    <div
      v-for="i in pages"
      :key="`progress-key-${i}`"
      ref="progress"
      class="progress"
      @click.self="onProgressClicked"
    ></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
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
    }
  },
  data() {
    return {
      bars: [] as HTMLElement[]
    };
  },
  watch: {
    currentIndex() {
      this.$nextTick(() => {
        window.requestAnimationFrame(this.updateBars);
      });
    },
    paused() {
      this.$nextTick(() => {
        window.requestAnimationFrame(this.togglePause);
      });
    },
    duration() {
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
  methods: {
    updateBars(): void {
      const followingBars = this.bars.slice(this.currentIndex + 1);
      const previousBars = this.bars.slice(0, this.currentIndex);
      const activeBar = this.bars[this.currentIndex];
      const animEndFunction = this.onAnimationEnd;

      activeBar.classList.add('active');
      activeBar.addEventListener('animationend', animEndFunction);

      previousBars.forEach(function (el: HTMLElement) {
        el.classList.remove('active', 'paused');
        el.removeEventListener('animationend', animEndFunction);
        el.classList.add('passed');
      });

      followingBars.forEach(function (el: HTMLElement) {
        el.classList.remove('active', 'passed', 'paused');
        el.removeEventListener('animationend', animEndFunction);
      });
    },
    onAnimationEnd(): void {
      this.$emit('on-animation-end');
    },
    onProgressClicked(event: MouseEvent): void {
      const target = event.target as HTMLElement;
      this.$emit('on-progress-clicked', this.bars.indexOf(target) as number);
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
      this.bars.forEach(function (el: HTMLElement) {
        el.style.animationDuration = newDuration;
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.progress-container {
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 10px 0;
}

.progress {
  cursor: pointer;
  height: 2px;
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
