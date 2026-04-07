<template>
  <VDialog
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    :height="$vuetify.display.mobile ? undefined : 'auto'"
    :width="$vuetify.display.mobile ? undefined : '70vw'"
    @after-leave="emit('close')">
    <VCard
      :loading="loading"
      height="100%"
      class="uno-flex uno-flex-col">
      <slot name="loader" />
      <VToolbar color="transparent">
        <template
          v-if="$slots.toolbarPrepend"
          #prepend>
          <slot name="toolbarPrepend" />
        </template>
        <template #append>
          <VBtn
            icon
            @click="model = false">
            <JIcon class="i-mdi:close" />
          </VBtn>
        </template>
        <VToolbarTitle>
          {{ title }}
        </VToolbarTitle>
      </VToolbar>

      <VCardSubtitle
        v-if="subtitle"
        class="pb-3">
        {{ subtitle }}
      </VCardSubtitle>

      <VDivider />

      <slot />

      <VDivider v-if="$slots.actions" />
      <VCardActions
        v-if="$slots.actions"
        class="uno-flex uno-items-center uno-pa-3"
        :class="{
          'uno-justify-end': !$vuetify.display.mobile,
          'uno-justify-center': $vuetify.display.mobile
        }">
        <slot name="actions" />
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
const { title, subtitle, loading } = defineProps<{
  title: string;
  subtitle?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const model = defineModel<boolean>();
</script>
