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
      <VList class="overflow-y-auto list">
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
import { useI18n } from 'vue-i18n';
import { clientSettings } from '@/store/client-settings';
import { getLocaleNativeName } from '@/utils/i18n';

const { bottom, large, elevated } = defineProps<{
  bottom?: boolean;
  large?: boolean;
  elevated?: boolean;
}>();

const i18n = useI18n();
</script>

<style scoped>
.list {
  max-height: 31em;
}
</style>
