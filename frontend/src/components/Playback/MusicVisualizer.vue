<template>
  <div ref="visualizerElement" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, useTemplateRef, watch } from 'vue';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { mediaWebAudio } from '@/store';

let visualizerInstance: AudioMotionAnalyzer | undefined;
const visualizerElement = useTemplateRef<HTMLDivElement>('visualizerElement');

/**
 * Destroy the visualizer instance.
 */
function destroy(): void {
  if (visualizerInstance) {
    visualizerInstance.destroy();
    visualizerInstance = undefined;
  }
}

watch(visualizerElement, () => {
  destroy();

  if (visualizerElement.value) {
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
  }
});

onBeforeUnmount(destroy);
</script>
