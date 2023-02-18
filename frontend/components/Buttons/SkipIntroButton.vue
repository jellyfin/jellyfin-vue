<template>
  <v-slide-y-reverse-transition>
    <div
      v-if="show"
      class="d-flex flex-row justify-center skip-intro-button-container"
    >
      <div class="pa-4 pl-s pr-s">
        <v-btn
          ref="skipIntro"
          outlined
          large
          :style="{
            '--transition-duration': `${visibleDuration}s`
          }"
          class="skip-intro my-2 py-2"
          @click="skipIntro()"
          @mouseenter="onMouseEnter()"
          @mouseleave="onMouseLeave()"
        >
          Skip Intro <v-icon size="32">mdi-skip-next</v-icon>
        </v-btn>
      </div>
    </div>
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
    }
  },
  data() {
    return {
      skipIntroClicked: false,
      visibleDuration:
        (this.intro?.HideSkipPromptAt || 0) -
        (this.intro?.ShowSkipPromptAt || 0),
      hover: false
    };
  },
  computed: {
    ...mapStores(playbackManagerStore),
    show(): boolean {
      if (this.skipIntroClicked) {
        return false;
      }

      if (!this.intro) {
        return false;
      }

      if (this.hover) {
        return this.intro.IntroStart <= this.intro.IntroEnd;
      }

      return (
        (this.playbackManager?.currentTime || 0) >=
          this.intro.ShowSkipPromptAt &&
        (this.playbackManager?.currentTime || 0) <= this.intro.HideSkipPromptAt
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
          if (this.show) {
            this.animate();
          }

          break;
        case PlaybackStatus.Stopped:
          this.unanimate();
          break;
      }
    }
  },
  mounted() {
    // console.log('mounting');
    //
    // if (this.intro && this.intro.ShowSkipPromptAt < 2) {
    //   this.animate();
    // }
  },
  methods: {
    skipIntro() {
      this.skipIntroClicked = true;
      this.playbackManager.changeCurrentTime(this.intro.IntroEnd);
    },
    animate() {
      setTimeout(() => {
        const button = (this.$refs.skipIntro as Vue).$el;

        button?.classList?.add('animate');
      }, 500);
    },
    unanimate() {
      const button = (this.$refs.skipIntro as Vue).$el;

      button?.classList?.remove('animate');
    },
    onMouseEnter() {
      this.hover = true;
    },
    onMouseLeave() {
      this.hover = false;
    }
  }
});
</script>

<style lang="scss" scoped>
.skip-intro {
  position: relative;
  overflow: hidden;
  z-index: 9999;
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

.skip-intro-button-container {
  position: absolute;
  bottom: 18%;
  width: 100%;
  z-index: 9999;
}
.skip-intro-button-container > div {
  width: calc(100vh * 1.77 - 2vh);
}

/* Media query for screen sizes up to 600px (sm) */
@media (max-width: 600px) {
  .skip-intro-button-container {
    bottom: 20%;
  }
}
</style>
