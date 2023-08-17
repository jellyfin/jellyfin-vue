<template>
  <div ref="visualizerElement" />
</template>

<script setup lang="ts">
import { shallowRef, onMounted, onBeforeUnmount } from 'vue';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { mediaWebAudio } from '@/store';

let visualizerInstance: AudioMotionAnalyzer;
const visualizerElement = shallowRef<HTMLDivElement>();

onMounted(() => {
  visualizerInstance = new AudioMotionAnalyzer(visualizerElement.value, {
    source: mediaWebAudio.sourceNode,
    connectSpeakers: false,
    mode: 2,
    gradient: 'prism',
    reflexRatio: 0.025,
    overlay: true,
    showBgColor: false,
    fftSize: 16_384,
    frequencyScale: 'bark',
    showScaleX: false,
    smoothing: 0.9
  });
});

onBeforeUnmount(() => {
  if (visualizerInstance) {
    visualizerInstance.disconnectInput();
    visualizerInstance.disconnectOutput();
  }
});
</script>
