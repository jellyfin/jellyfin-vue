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
      :text="$t('tooltips.changeLanguage')"
      :location="bottom ? 'bottom' : 'top'" />
    <VMenu>
      <VList class="overflow-y-auto">
        <VListItem
          :value="clientSettings.locale === 'auto'"
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
import { useI18n } from 'vue-i18n';
import { clientSettingsStore } from '@/store';
import { getLocaleNativeName } from '@/utils/i18n';

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
