<template>
  <v-dialog
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    :height="$vuetify.display.mobile ? undefined : 'auto'"
    :width="$vuetify.display.mobile ? undefined : '70vw'"
    @after-leave="emit('close')">
    <v-card :loading="loading" height="100%" class="d-flex flex-column">
      <slot name="loader" />
      <v-toolbar color="transparent">
        <template v-if="slots.toolbarPrepend" #prepend>
          <slot name="toolbarPrepend" />
        </template>
        <template #append>
          <v-btn icon @click="model = false">
            <i-mdi-close />
          </v-btn>
        </template>
        <v-toolbar-title>
          {{ title }}
        </v-toolbar-title>
      </v-toolbar>

      <v-card-subtitle v-if="subtitle" class="pb-3">
        {{ subtitle }}
      </v-card-subtitle>

      <v-divider />

      <slot />

      <v-divider v-if="slots.actions" />
      <v-card-actions
        v-if="slots.actions"
        class="d-flex align-center pa-3"
        :class="{
          'justify-end': !$vuetify.display.mobile,
          'justify-center': $vuetify.display.mobile
        }">
        <slot name="actions" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, useSlots } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  subtitle?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const slots = useSlots();
const model = ref(props.modelValue);
</script>
