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
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop">
      <div class="uno-flex uno-flex-col uno-items-center uno-text-center">
        <JIcon class="i-mdi:cloud-upload uno-text-5xl uno-text-gray" />
        <div class="uno-font-bold uno-text-3xl uno-mt-4">
          {{ t('dragAndDropFileHere') }}
        </div>
        <div class="uno-flex uno-items-center uno-gap-4 uno-text-sm uno-text-gray-500 uno-w-full uno-justify-center my-6">
          <div class="uno-flex-1 uno-border-t uno-border-gray-300 uno-w-[20%] uno-max-w-[200px]" />
          <span class="uno-font-medium uno-text-xl">{{ t('or').toLowerCase() }}</span>
          <div class="uno-flex-1 uno-border-t uno-border-gray-300 uno-w-[20%] uno-max-w-[200px]" />
        </div>
        <div>
          <VBtn
            variant="flat"
            block
            size="large"
            color="primary"
            @click="onDropZoneClick">
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
        @click="onClearButtonClick">
        <JIcon class="i-mdi:delete uno-min-w-10" />
      </VBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, ref, watch } from 'vue';
import JIcon from './JIcon.vue';

const { accept, disabled } = defineProps<{
  accept?: string;
  disabled?: boolean;
}>();

const { t } = useTranslation();

const file = defineModel<File | undefined>();

const inputRef = ref<HTMLInputElement | undefined>(undefined);
const dragging = ref(false);
const preview = ref<string | undefined>(undefined);
const errorMessage = ref<string | undefined>(undefined);

const acceptedFileRules = computed(() => {
  const exactTypes = new Set<string>();
  const wildcards: string[] = [];

  if (!accept) {
    return { exactTypes, wildcards };
  }

  for (const raw of accept.split(',')) {
    const value = raw.trim();

    if (!value) {
      continue;
    }

    if (value.endsWith('/*')) {
      wildcards.push(value.slice(0, -1));
    } else {
      exactTypes.add(value);
    }
  }

  return { exactTypes, wildcards };
});

/**
 * Handles the file update and validation.
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
 * Handles the file input change.
 */
function onInputChange(event: Event): void {
  const target = event.target as HTMLInputElement;

  updateFile(target.files?.[0]);
  target.value = '';
}

/**
 * Handles the file drop.
 */
function onDrop(e: DragEvent): void {
  e.preventDefault();
  dragging.value = false;
  updateFile(e.dataTransfer?.files[0]);
}

/**
 * Handles the file drag over.
 */
function onDragOver(e: DragEvent): void {
  e.preventDefault();
  dragging.value = true;
}

/**
 * Handles the file drag leave.
 */
function onDragLeave(): void {
  dragging.value = false;
}

/**
 * Handles the drop zone click.
 */
function onDropZoneClick(): void {
  if (disabled) {
    return;
  }

  inputRef.value?.click();
}

/**
 * Handles the image clear icon click.
 */
function onClearButtonClick(): void {
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
