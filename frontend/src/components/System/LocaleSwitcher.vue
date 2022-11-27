<template>
  <v-menu offset-y>
    <template #activator="{ props: menu }">
      <v-tooltip :location="bottom ? 'bottom' : 'top'">
        <template #activator="{ props: tooltip }">
          <v-btn
            icon
            :size="large ? 'large' : 'small'"
            v-bind="mergeProps(menu, tooltip)">
            <Icon>
              <i-mdi-web />
            </Icon>
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
        @click="clientSettings.setLocale(item)">
        <v-list-item-title>{{ localeNames[item] }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { mergeProps } from 'vue';
import { useI18n } from 'vue-i18n';
import { clientSettingsStore } from '~/store';

const clientSettings = clientSettingsStore();
const localeNames = useI18n().localeNames;

defineProps({
  bottom: {
    required: false,
    type: Boolean
  },
  large: {
    required: false,
    type: Boolean
  },
  top: {
    required: false,
    type: Boolean
  }
});
</script>

<style lang="scss" scoped>
.v-list {
  max-height: 31em;
}
</style>
