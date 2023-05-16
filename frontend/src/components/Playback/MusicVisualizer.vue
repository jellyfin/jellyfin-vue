<template>
  <div ref="musicVisualizer" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { mediaElementRef } from '@/store';

let visualizer: AudioMotionAnalyzer;
const musicVisualizer = ref(undefined);

onMounted(() => {
  visualizer = new AudioMotionAnalyzer(musicVisualizer.value, {
    source: mediaElementRef.value,
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
});

onBeforeUnmount(() => {
  if (visualizer) {
    visualizer.toggleAnalyzer();
    visualizer.disconnectInput();
    visualizer.disconnectOutput();

    if (mediaElementRef.value) {
      const audioCtx = new AudioContext();

      audioCtx
        .createMediaElementSource(mediaElementRef.value)
        .connect(audioCtx.destination);
    }
  }
});
</script>
