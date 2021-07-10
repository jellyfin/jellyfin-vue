<template>
  <v-fade-transition>
    <canvas
      v-show="!loading && pixels"
      ref="canvas"
      :key="`canvas-${hash}`"
      :width="width"
      :height="height"
      class="absolute"
    />
  </v-fade-transition>
</template>

<script setup lang="ts">
import { decode } from 'blurhash';
import type { Ref } from 'vue';
import { defineEmits, defineProps, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps({
  hash: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    default: 32
  },
  height: {
    type: Number,
    default: 32
  },
  punch: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits<{ (event: 'error'): void }>();

const loading: Ref<boolean> = ref(true);
const canvas: Ref<HTMLCanvasElement | undefined> = ref();
const pixels: Ref<Uint8ClampedArray | undefined> = ref();

const draw = () => {
  if (canvas.value) {
    const context = canvas.value.getContext('2d');
    const imageData = context?.createImageData(props.width, props.height);

    if (imageData && pixels.value) {
      imageData.data.set(pixels.value);
      context?.putImageData(imageData, 0, 0);
      loading.value = false;
    }
  }
};

const getPixelsFromWorker = async () => {
  try {
    // TODO(migration): Make this a worker
    pixels.value = decode(props.hash, props.width, props.height, props.punch);
  } catch {
    pixels.value = undefined;
    emit('error');
  }
};

watch(
  () => props?.hash,
  () => {
    nextTick(() => {
      loading.value = true;
      getPixelsFromWorker();
    });
  }
);

watch(pixels, () => {
  draw();
});

onMounted(() => {
  getPixelsFromWorker();
});
</script>

<style lang="scss" scoped>
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s;
}

.fade-fast-enter,
.fade-fast-leave-to {
  opacity: 0;
}

.absolute {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
