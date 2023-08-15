<template>
  <v-btn
    icon
    :variant="elevated ? 'elevated' : undefined"
    :size="large ? 'large' : 'small'"
    :color="elevated ? undefined : 'primary'">
    <v-icon>
      <i-mdi-web />
    </v-icon>
    <v-tooltip
      :text="$t('tooltips.changeLanguage')"
      :location="bottom ? 'bottom' : 'top'" />
    <v-menu>
      <v-list class="overflow-y-auto">
        <v-list-item
          :value="clientSettings.locale === 'auto'"
          :title="$t('auto')"
          @click="clientSettings.locale = 'auto'" />
        <v-divider />
        <v-list-item
          v-for="(item, index) in i18n.availableLocales"
          :key="index"
          :value="item === i18n.locale.value"
          :title="getLocaleNativeName(item) ?? `${$t('unknown')} (${item})`"
          @click="clientSettings.locale = item" />
      </v-list>
    </v-menu>
  </v-btn>
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
