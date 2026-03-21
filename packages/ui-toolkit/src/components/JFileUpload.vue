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
      :class="[
        'uno-min-h-84 uno-flex uno-flex-col uno-items-center uno-justify-center',
        'uno-border-2 uno-border-dashed uno-rounded-xl uno-p-8 uno-text-center uno-bg-transparent',
        dragging
          ? 'uno-border-blue-500 uno-bg-blue-50'
          : 'uno-border-gray-300 hover:uno-border-gray-400 uno-bg-gray-50'
      ]"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop">
      <div class="uno-flex uno-flex-col uno-items-center uno-text-center">
        <JIcon class="i-mdi:cloud-upload uno-text-5xl uno-text-gray" />
        <div>
          <div class="uno-font-bold uno-text-3xl uno-mt-4">
            {{ t('dragAndDropFileHere') }}
          </div>
          <div class="uno-flex uno-items-center uno-gap-4 uno-text-sm uno-text-gray-500 uno-w-full uno-justify-center uno-my-6">
            <div class="uno-flex-1 uno-border-t uno-border-gray-300 uno-w-[100%]" />
          </div>
        </div>

        <div>
          <VBtn
            variant="flat"
            block
            size="large"
            color="primary"
            @click="onBrowseButtonClick">
            {{ t('browseFiles') }}
          </VBtn>
        </div>
      </div>
    </div>
    <div
      v-if="errorMessage"
      class="uno-mt-2 uno-text-red">
      {{ errorMessage }}
    </div>
    <div
      v-if="file"
      class="uno-flex uno-items-center uno-gap-4 uno-p-3 uno-rounded-lg uno-border
      uno-border-gray-200 uno-bg-transparent uno-mt-6
      dark:uno-border-gray-700">
      <img
        v-if="preview"
        :alt="t('preview')"
        :src="preview"
        class="uno-w-12 uno-h-12 uno-object-cover uno-rounded-md uno-border uno-border-gray-200 dark:uno-border-gray-700">
      <div>
        <div class="uno-font-medium uno-text-gray-900 dark:uno-text-gray-100 uno-break-all">
          {{ file.name }}
        </div>
        <div class="uno-text-gray-700 dark:uno-text-gray-100 uno-break-all">
          {{ file.type }}
        </div>
      </div>
      <VBtn
        icon
        size="medium"
        class="uno-ml-auto"
        @click="onClearButtonClick">
        <JIcon class="i-mdi:delete uno-min-w-10" />
      </VBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useEventListener } from '@vueuse/core';
import JIcon from './JIcon.vue';
import type { JFileUploadExpose } from '#/types';

const { accept, disabled } = defineProps<{
  accept?: string;
  disabled?: boolean;
}>();

const { t } = useTranslation();

const file = defineModel<File | undefined>();

const inputRef = ref<HTMLInputElement | undefined>(undefined);
const dragging = shallowRef(false);
const preview = shallowRef<string | undefined>();
const errorMessage = shallowRef<string | undefined>();

const acceptedFileRules = computed(() => {
  const exactTypes = new Set<string>();
  const wildcards: string[] = [];

  if (!accept) {
    return { exactTypes, wildcards };
  }

  for (const raw of accept.split(',')) {
    const value = raw.trim();

    if (value.endsWith('/*')) {
      wildcards.push(value.slice(0, -1));
    } else if (value) {
      exactTypes.add(value);
    }
  }

  return { exactTypes, wildcards };
});

/**
 * Handle the file update and validation.
 */
function updateFile(value: File | undefined): void {
  errorMessage.value = undefined;

  if (!value) {
    file.value = undefined;

    return;
  }

  let isFileAccepted = !accept;

  if (!isFileAccepted) {
    const { exactTypes, wildcards } = acceptedFileRules.value;

    isFileAccepted = exactTypes.has(value.type) || wildcards.some(prefix => value.type.startsWith(prefix));
  }

  if (!isFileAccepted) {
    errorMessage.value = t('invalidFileFormat');
    file.value = undefined;

    return;
  }

  file.value = value;
}

/**
 * Handle the file input change.
 */
function onInputChange(event: Event): void {
  const target = event.target as HTMLInputElement;

  updateFile(target.files?.[0]);
  target.value = '';
}

/**
 * Handle the file drop.
 */
function onDrop(e: DragEvent): void {
  dragging.value = false;

  if (disabled) {
    return;
  }

  updateFile(e.dataTransfer?.files[0]);
}

/**
 * Handle the file drag over.
 */
function onDragOver(): void {
  if (disabled) {
    return;
  }

  dragging.value = true;
}

/**
 * Handle the file drag leave.
 */
function onDragLeave(): void {
  dragging.value = false;
}

/**
 * Handle the drop zone click.
 */
function onBrowseButtonClick(): void {
  if (disabled) {
    return;
  }

  inputRef.value?.click();
}

/**
 * Handle the image clear icon click.
 */
function onClearButtonClick(): void {
  file.value = undefined;
  errorMessage.value = undefined;
}

/**
 * Read the file content in base64 format.
 */
async function readSelectedFileAsBase64(): Promise<string | undefined> {
  if (!file.value) {
    return undefined;
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    useEventListener(reader, 'load', () => {
      const result = reader.result as string;
      const base64FileContent = result.split(',')[1];

      if (!base64FileContent) {
        reject(new Error('Failed to read file content'));

        return;
      }

      resolve(base64FileContent);
    }, { once: true });

    useEventListener(reader, 'error', () => {
      reject(reader.error ?? new Error('File reading failed'));
    }, { once: true });

    reader.readAsDataURL(file.value as Blob);
  });
}

defineExpose<JFileUploadExpose>({
  readSelectedFileAsBase64
});

watch(file, (newFile) => {
  if (preview.value) {
    URL.revokeObjectURL(preview.value);
    preview.value = undefined;
  }

  if (!newFile) {
    preview.value = undefined;

    return;
  }

  if (newFile.type.startsWith('image/')) {
    preview.value = URL.createObjectURL(newFile);
  }
});

onBeforeUnmount(() => {
  if (preview.value) {
    URL.revokeObjectURL(preview.value);
  }
});

</script>
