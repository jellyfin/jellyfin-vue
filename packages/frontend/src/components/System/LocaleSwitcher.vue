<template>
  <JTooltip
    :text="t('language')"
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
            v-for="(item, index) in languages"
            :key="index"
            :value="item === i18next.language"
            :title="getLocaleNativeName(item) ?? `${$t('unknown')} (${item})`"
            @click="async () => await i18next.changeLanguage(item)" />
        </VList>
      </VMenu>
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { languages } from '@jellyfin-vue/i18n';
import { useTranslation } from 'i18next-vue';
import { clientSettings } from '#/store/settings/client';
import { getLocaleNativeName } from '#/utils/i18n';

const { bottom, large, elevated } = defineProps<{
  bottom?: boolean;
  large?: boolean;
  elevated?: boolean;
}>();

const { t, i18next } = useTranslation();
</script>

<style scoped>
.list {
  max-height: 31em;
}
</style>
