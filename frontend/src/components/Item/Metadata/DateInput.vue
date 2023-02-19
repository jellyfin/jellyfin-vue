<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition">
    <template #activator="{ on, attrs }">
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

defineProps<{
  value: string;
  label: string;
}>();

defineEmits<{
  (e: 'update:date', value: string): void;
}>();

const menu = ref(false);

// const handleChange = (value: string): void => {
//   menu.value = false;
//   emit('update:date', value);
// };
</script>
