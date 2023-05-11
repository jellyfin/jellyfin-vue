<template>
  <div class="d-flex flex-row">
    <span class="mdinfo-label">{{ name + ' ' }}</span>
    <span class="mdinfo-value">{{ parsedValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export interface MediaDetailAttribute {
  name: string;
  value?: string | number | boolean;
}

const props = defineProps<MediaDetailAttribute>();
const { t } = useI18n();

const parsedValue = computed(() => {
  if (typeof props.value === 'boolean') {
    return props.value ? t('yes') : t('no');
  }

  return props.value ?? 'Unknown';
});
</script>

<style lang="scss" scoped>
.mdinfo-label {
  display: inline-block;
  font-weight: 600;
}
.mdinfo-value {
  display: inline-block;
  margin-left: 0.5rem;
  font-weight: 400;
}
</style>
