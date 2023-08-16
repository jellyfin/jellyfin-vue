<template>
  <div ref="visualizerElement" />
</template>

<script setup lang="ts">
/**
 * TODO: When the WebAudio node is connected to audiomotion-analyzer, the volume
 * of the media increases abruptly. Investigate why and fix.
 */
import { shallowRef, onMounted, onBeforeUnmount } from 'vue';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { mediaWebAudio } from '@/store';

let visualizerInstance: AudioMotionAnalyzer;
const visualizerElement = shallowRef<HTMLDivElement>();

onMounted(() => {
  visualizerInstance = new AudioMotionAnalyzer(visualizerElement.value, {
    source: mediaWebAudio.sourceNode,
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
