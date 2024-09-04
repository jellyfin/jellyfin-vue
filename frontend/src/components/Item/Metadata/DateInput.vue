<template>
  <VTextField
    :model-value="value"
    :label="label"
    readonly
    variant="outlined">
    <VMenu
      v-model="menu"
      :close-on-content-click="false"
      transition="scale-transition">
      <!-- TODO: Wait for Vuetify 3 implementation (https://github.com/vuetifyjs/vuetify/issues/13480) -->
      <!-- <v-date-picker :value="value" @change="handleChange" /> -->
    </VMenu>
  </VTextField>
</template>
<script setup lang="ts">
import { shallowRef } from 'vue';

const { value, label } = defineProps<{
  value: string;
  label: string;
}>();

defineEmits<{
  'update:date': [value: string];
}>();

const menu = shallowRef(false);

/*
 * Const handleChange = (value: string): void => {
 *   menu.value = false;
 *   emit('update:date', value);
 * };
 */
</script>
