<template>
  <v-slide-y-reverse-transition>
    <v-btn
      v-if="show"
      ref="skipIntro"
      outlined
      :large="large"
      :small="!large"
      :style="{
        '--transition-duration': `${visibleDuration}s`,
        '--fade-duration': `1s`
      }"
      class="skip-intro"
      :class="{ 'mr-10': large, 'ma-4': large, 'ma-1': !large }"
      @click="skipIntro()"
      @mouseenter="onMouseEnter()"
      @mouseleave="onMouseLeave()"
    >
      Skip Intro <v-icon v-if="large" size="32">mdi-skip-next</v-icon>
    </v-btn>
  </v-slide-y-reverse-transition>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { mapStores } from 'pinia';
import { playbackManagerStore, PlaybackStatus } from '~/store';
import { IntroSkipperResponse } from '~/plugins/nuxt/apiPlugin';

export default Vue.extend({
  props: {
    intro: {
      type: Object as PropType<IntroSkipperResponse>,
      required: true
    },
    large: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  data() {
    return {
      visibleDuration:
        (this.intro?.HideSkipPromptAt || 0) -
        (this.intro?.ShowSkipPromptAt || 0),
      hover: false
    };
  },
  computed: {
    ...mapStores(playbackManagerStore),
    show(): boolean {
      if (!this.intro) {
        return false;
      }

      if (this.hover) {
        return (this.playbackManager?.currentTime || 0) < this.intro.IntroEnd;
      }

      return (
        (this.playbackManager?.currentTime || 0) >=
          this.intro.ShowSkipPromptAt &&
        (this.playbackManager?.currentTime || 0) <= this.intro.HideSkipPromptAt
      );
    },
    visibleDurationLeft(): number {
      return (
        this.intro.HideSkipPromptAt - (this.playbackManager?.currentTime || 0)
      );
    }
  },
  watch: {
    show() {
      if (this.show) {
        this.animate();
      } else {
        this.unanimate();
      }
    },
    'playbackManager.status'(): void {
      switch (this.playbackManager.status) {
        case PlaybackStatus.Playing:
          if (this.show && !this.hover) {
            this.animate();
          }

          break;
        case PlaybackStatus.Stopped:
          this.unanimate();
          break;
      }
    }
  },
  methods: {
    skipIntro() {
      this.playbackManager.changeCurrentTime(this.intro.IntroEnd);
    },
    animate() {
      setTimeout(() => {
        const button = (this.$refs.skipIntro as Vue)?.$el as HTMLElement;

        button?.style?.setProperty(
          '--transition-duration',
          this.visibleDurationLeft + 's'
        );
        button?.classList?.remove('deanimate');
        button?.classList?.add('animate');
      }, 500);
    },
    unanimate() {
      const button = (this.$refs.skipIntro as Vue).$el;

      button?.classList?.remove('animate');
      button?.classList?.add('deanimate');
    },
    onMouseEnter() {
      this.unanimate();
      this.hover = true;
    },
    onMouseLeave() {
      this.animate();
      this.hover = false;
    }
  }
});
</script>

<style lang="scss" scoped>
.skip-intro {
  overflow: hidden;
  z-index: 9999;
  right: 0;
  position: absolute;
  bottom: 23%;
}

.skip-intro::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  opacity: 0.9 !important;
  height: 100%;
  background-color: var(--v-primary-base);
  transition: width ease-out;
}

.skip-intro.animate::before {
  width: 100%;
  transition-duration: var(--transition-duration);
}

.skip-intro.deanimate::before {
  width: 0;
  transition-duration: var(--fade-duration);
}

/* Media query for screen sizes up to 600px (sm) */
@media (max-width: 600px) {
  .skip-intro {
    bottom: 25%;
  }
}
</style>
