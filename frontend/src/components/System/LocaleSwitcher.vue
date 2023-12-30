<template>
  <VBtn
    icon
    :variant="elevated ? 'elevated' : undefined"
    :size="large ? 'large' : 'small'"
    :color="elevated ? undefined : 'primary'">
    <VIcon>
      <IMdiWeb />
    </VIcon>
    <VTooltip
      :text="$t('language')"
      :location="bottom ? 'bottom' : 'top'" />
    <VMenu>
      <VList class="overflow-y-auto">
        <VListItem
          :title="$t('auto')"
          @click="clientSettings.locale = 'auto'" />
        <VDivider />
        <VListItem
          v-for="(item, index) in i18n.availableLocales"
          :key="index"
          :value="item === i18n.locale.value"
          :title="getLocaleNativeName(item) ?? `${$t('unknown')} (${item})`"
          @click="clientSettings.locale = item" />
      </VList>
    </VMenu>
  </VBtn>
</template>

<script setup lang="ts">
import { clientSettingsStore } from '@/store';
import { getLocaleNativeName } from '@/utils/i18n';
import { useI18n } from 'vue-i18n';

defineProps<{
  bottom?: boolean;
  large?: boolean;
  top?: boolean;
  elevated?: boolean;
}>();

const i18n = useI18n();
const clientSettings = clientSettingsStore();
</script>

<style lang="scss" scoped>
.v-list {
  max-height: 31em;
}
</style>
