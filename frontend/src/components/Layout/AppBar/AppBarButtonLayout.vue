<template>
  <div class="ma-1">
    <v-btn
      class="align-self-center"
      icon
      size="small"
      :color="color"
      variant="elevated"
      :disabled="disabled">
      <slot name="icon" />

      <v-tooltip location="bottom">
        <slot name="tooltip" />
      </v-tooltip>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

const route = useRoute();
const display = useDisplay();
const { y } = useWindowScroll();

defineProps({
  color: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const transparentLayout = computed<boolean>(() => {
  return route.meta.transparentLayout || false;
});

const fab = computed(() => {
  return !(!transparentLayout.value || display.xs) && y.value > 1;
});
</script>
