<template>
  <div class="uno-w-full">
    <input
      ref="inputRef"
      type="file"
      class="uno-hidden"
      :accept="accept"
      :disabled="disabled"
      @change="onInputChange">
    <div
      tabindex="0"
      :class="[
        'uno-min-h-84 uno-flex uno-flex-col items-center justify-center',
        'uno-border-2 uno-border-dashed uno-rounded-xl uno-p-8 uno-text-center uno-bg-transparent',
        dragging
          ? 'uno-border-blue-500 uno-bg-blue-50'
          : 'uno-border-gray-300 hover:uno-border-gray-400 uno-bg-gray-50'
      ]"
      @click="openPicker"
      @dragover="dragOver"
      @dragleave="dragLeave"
      @drop="drop">
      <div class="uno-flex uno-flex-col uno-items-center uno-text-center">
        <JIcon class="i-mdi:cloud-upload uno-text-5xl uno-text-gray" />
        <div class="uno-font-bold uno-text-3xl uno-mt-4">
          Drag and drop file here
        </div>
        <div class="uno-flex uno-items-center uno-gap-4 uno-text-sm uno-text-gray-500 uno-w-full uno-justify-center my-6">
          <div class="uno-flex-1 uno-border-t uno-border-gray-300 uno-w-[20%] uno-max-w-[200px]" />
          <span class="uno-font-medium uno-text-xl">or</span>
          <div class="uno-flex-1 uno-border-t uno-border-gray-300 uno-w-[20%] uno-max-w-[200px]" />
        </div>
        <div>
          <VBtn
            variant="flat"
            block
            size="large"
            color="primary"
            @click="clearFile">
            Browse files
          </VBtn>
        </div>
      </div>
    </div>
    <div
      v-if="file"
      class="uno-flex uno-items-center uno-gap-4 uno-p-3 uno-rounded-lg uno-border
      uno-border-gray-200 uno-bg-transparent uno-mt-6
      dark:uno-border-gray-700">
      <img
        v-if="preview"
        :src="preview"
        class="uno-w-12 uno-h-12 uno-object-cover uno-rounded-md uno-border uno-border-gray-200 dark:uno-border-gray-700">
      <div class="flex flex-col">
        <div class="uno-font-medium uno-text-gray-900 dark:uno-text-gray-100 uno-break-all">
          {{ file.name }}
        </div>
        <div class="uno-text-small uno-text-gray-700 dark:uno-text-gray-100 uno-break-all">
          {{ file.type }}
        </div>
      </div>
      <VBtn
        icon
        class="ml-auto"
        size="medium"
        @click="clearFile">
        <JIcon class="i-mdi:delete uno-min-w-10" />
      </VBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import JIcon from './JIcon.vue';

const { accept = '', disabled } = defineProps<{
  modelValue: File | undefined;
  accept?: string;
  disabled?: boolean;
}>();

const file = defineModel<File | undefined>();

const inputRef = ref<HTMLInputElement | undefined>(undefined);
const dragging = ref(false);
const preview = ref<string | undefined>(undefined);

/**
 * Sets file.
 */
function setFile(value: File | undefined): void {
  file.value = value;
}

/**
 * Handles the file input change.
 */
function onInputChange(event: Event): void {
  const target = event.target as HTMLInputElement;

  setFile(target.files?.[0] ?? undefined);
  target.value = '';
}

/**
 * Drops file.
 */
function drop(e: DragEvent): void {
  e.preventDefault();
  dragging.value = false;
  setFile(e.dataTransfer?.files[0] ?? undefined);
}

/**
 * Drops file.
 */
function dragOver(e: DragEvent): void {
  e.preventDefault();
  dragging.value = true;
}

/**
 * Drops file.
 */
function dragLeave(): void {
  dragging.value = false;
}

/**
 * Drops file.
 */
function openPicker(): void {
  inputRef.value?.click();
}

/**
 * Drops file.
 */
function clearFile(): void {
  file.value = undefined;
}

watch(file, (newFile) => {
  if (!newFile) {
    preview.value = undefined;

    return;
  }

  preview.value = newFile.type.startsWith('image/') ? URL.createObjectURL(newFile) : undefined;
});

</script>
