<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition">
    <template #:activator="{ on, attrs }">
      <v-text-field
        :model-value="value"
        :label="label"
        readonly
        variant="outlined"
        v-bind="attrs"
        v-on="on" />
    </template>
    <!-- TODO: Wait for Vuetify 3.1 -->
    <!-- <v-date-picker :value="value" @change="handleChange" /> -->
  </v-menu>
</template>
<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  value: string;
  label: string;
}>();

const emit = defineEmits<{
  (e: 'update:date', value: string): void;
}>();

const menu = ref(false);

function handleChange(value: string) {
  menu.value = false;
  emit('update:date', value);
}
</script>
