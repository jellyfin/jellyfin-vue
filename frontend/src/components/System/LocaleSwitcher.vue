<template>
  <JTooltip
    :text="$t('language')"
    :position="bottom ? 'bottom' : 'top'">
    <VBtn
      icon
      :variant="elevated ? 'elevated' : undefined"
      :size="large ? 'large' : 'small'"
      :color="elevated ? undefined : 'primary'">
      <JIcon class="i-mdi:language" />
      <VMenu>
        <VList class="overflow-y-auto list">
          <VListItem
            :title="$t('auto')"
            @click="clientSettings.locale.value = undefined" />
          <VDivider />
          <VListItem
            v-for="(item, index) in i18n.availableLocales"
            :key="index"
            :value="item === i18n.locale.value"
            :title="getLocaleNativeName(item) ?? `${$t('unknown')} (${item})`"
            @click="clientSettings.locale.value = item" />
        </VList>
      </VMenu>
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { clientSettings } from '#/store/settings/client';
import { getLocaleNativeName } from '#/utils/i18n';

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
