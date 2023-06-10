<template>
  <div ref="musicVisualiser" />
</template>

<script lang="ts">
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { mediaElementRef } from '@/store';

let visualiser: AudioMotionAnalyzer | undefined;

export default {
  mounted(): void {
    visualiser = new AudioMotionAnalyzer(this.$refs.musicVisualiser, {
      source: mediaElementRef._value,
      mode: 2,
      gradient: 'prism',
      reflexRatio: 0.025,
      overlay: true,
      showBgColor: true,
      bgAlpha: 0,
      fftSize: 16_384,
      frequencyScale: 'bark',
      showScaleX: false,
      smoothing: 0.9
    });
  },

  onBeforeUnmount(): void {
    visualiser?.toggleAnalyzer();
    visualiser = undefined;
  }
};
</script>
