<template>
  <v-menu>
    <template #activator="{ props: menu }">
      <v-tooltip :location="bottom ? 'bottom' : 'top'">
        <template #activator="{ props: tooltip }">
          <v-btn
            icon
            :variant="elevated ? 'elevated' : undefined"
            :size="large ? 'large' : 'small'"
            :color="elevated ? undefined : 'primary'"
            v-bind="mergeProps(menu, tooltip)">
            <v-icon>
              <i-mdi-web />
            </v-icon>
          </v-btn>
        </template>
        <span>{{ $t('tooltips.changeLanguage') }}</span>
      </v-tooltip>
    </template>
    <v-list class="overflow-y-auto">
      <v-list-item
        :value="clientSettings.locale === 'auto'"
        :title="$t('auto')"
        @click="clientSettings.locale = 'auto'" />
      <v-divider />
      <v-list-item
        v-for="(item, index) in availableLocales"
        :key="index"
        :value="item === i18n.locale.value"
        :title="languageMap[item]"
        @click="clientSettings.locale = item" />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { mergeProps, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { clientSettingsStore } from '@/store';

type Locales = keyof ReturnType<typeof useI18n>['localeNames'];

const i18n = useI18n();
const languageMap = i18n.localeNames;
const clientSettings = clientSettingsStore();
const availableLocales = computed<Locales[]>(
  () => Object.keys(languageMap) as Array<Locales>
);

defineProps<{
  bottom?: boolean;
  large?: boolean;
  top?: boolean;
  elevated?: boolean;
}>();
</script>

<style lang="scss" scoped>
.v-list {
  max-height: 31em;
}
</style>
