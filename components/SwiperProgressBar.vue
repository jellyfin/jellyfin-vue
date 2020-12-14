<template>
  <div class="progress-container">
    <div
      v-for="i in pages"
      :key="i"
      ref="swiperProgressBars"
      :style="cssVars"
      class="progress"
    ></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    pages: {
      type: Number,
      required: true,
      default: 0
    },
    currentIndex: {
      type: Number,
      required: true,
      default: -1
    },
    duration: {
      type: Number,
      required: true,
      default: 0
    },
    paused: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  data() {
    return {
      bars: [] as Element[]
    };
  },
  computed: {
    cssVars: {
      get() {
        return {
          '--swiper-animation-duration': (this.duration / 1000).toString() + 's'
        };
      }
    }
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
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.bars = this.$refs.swiperProgressBars as Array<Element>;
      window.requestAnimationFrame(this.updateBars);
    });
  },
  methods: {
    updateBars(): void {
      const followingBars = this.bars.slice(this.currentIndex + 1);
      const previousBars = this.bars.slice(0, this.currentIndex);
      this.bars[this.currentIndex].classList.add('active');

      previousBars.forEach(function (el: Element) {
        el.classList.remove('active');
        el.classList.add('passed');
      });

      followingBars.forEach(function (el: Element) {
        el.classList.remove('active', 'passed', 'paused');
      });
    },
    togglePause(): void {
      if (this.paused) {
        this.bars[this.currentIndex].classList.add('paused');
      } else {
        this.bars[this.currentIndex].classList.remove('paused');
      }
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
  cursor: pointer;
}

.progress {
  height: 2px;
  flex-grow: 1;
  border-radius: 4px;
  margin: 0 3px;
  display: flex;
  background-image: -webkit-linear-gradient(
    left,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(88, 89, 104, 0.5) 50.001%,
    rgba(88, 89, 104, 0.5) 100%
  );
  background-repeat: no-repeat;
  background-size: 200%;
  background-color: #666;
  background-position: 100% 50%;
  animation-timing-function: linear;
  animation-delay: 0s;
  animation-fill-mode: forwards;
  animation-duration: var(--swiper-animation-duration);
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
