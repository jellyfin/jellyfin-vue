<template>
  <div class="ma-1">
    <v-tooltip location="bottom">
      <template #activator="{ on, attrs }">
        <v-btn
          class="align-self-center active-button"
          :icon="!fab"
          :fab="fab"
          :size="fab && 'small'"
          :class="{ 'ma-n1': !fab }"
          :color="color"
          :disabled="disabled"
          v-bind="attrs"
          v-on="$slots.tooltip ? { ...on, ...customListener } : customListener">
          <slot name="icon" />
        </v-btn>
      </template>
      <slot name="tooltip" />
    </v-tooltip>
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
  },
  customListener: {
    type: Object as () => EventTarget,
    default: undefined
  }
});

const transparentLayout = computed(() => {
  return typeof route.meta.layout !== 'string' && route.meta.layout?.transparent
    ? route.meta.layout.transparent
    : false;
});

const fab = computed(() => {
  return !(!transparentLayout.value || display.xs) && y.value > 1;
});
</script>
