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
        v-for="(item, index) in $i18n.availableLocales"
        :key="index"
        :value="item === $i18n.locale"
        @click="clientSettings.locale = item">
        <v-list-item-title>{{ localeNames[item] }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { mergeProps } from 'vue';
import { useI18n } from 'vue-i18n';
import { clientSettingsStore } from '@/store';

const clientSettings = clientSettingsStore();
const localeNames = useI18n().localeNames;

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
