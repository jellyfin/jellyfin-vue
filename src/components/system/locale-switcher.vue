<template>
  <v-menu offset-y>
    <template #activator="{ on: onMenu, attrs: attrsMenu }">
      <v-tooltip :bottom="bottom" :top="top">
        <template #activator="{ on: onTooltip, attrsTooltip }">
          <v-btn
            :icon="!fab"
            :fab="fab"
            :small="!large && fab"
            :large="large"
            :class="{ 'mr-n1': !fab, 'ml-1': fab }"
            v-bind="{ ...attrsMenu, ...attrsTooltip }"
            v-on="{ ...onMenu, ...onTooltip }"
          >
            <v-icon>mdi-web</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('tooltips.changeLanguage') }}</span>
      </v-tooltip>
    </template>
    <v-list class="overflow-y-auto">
      <v-list-item
        v-for="(item, index) in availableLocales"
        :key="index"
        :input-value="item.code === locale"
        @click="locale = item.code"
      >
        <v-list-item-title>{{ item.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  props: {
    fab: {
      type: Boolean,
      required: false
    },
    large: {
      type: Boolean,
      required: false
    },
    top: {
      type: Boolean,
      required: false
    },
    bottom: {
      type: Boolean,
      required: false
    }
  },
  setup() {
    const { locale } = useI18n();
    const availableLocales = ref([
      { code: 'am', iso: 'am', name: 'አማርኛ' },
      { code: 'ar', iso: 'ar', name: 'العربية' },
      {
        code: 'be',
        iso: 'be',
        name: 'беларуская мова',
        file: 'be_Latn.json'
      },
      { code: 'ca', iso: 'ca', name: 'Català' },
      { code: 'cs', iso: 'cs', name: 'Čeština' },
      { code: 'de', iso: 'de', name: 'Deutsch' },
      { code: 'el', iso: 'el', name: 'ελληνικά' },
      { code: 'en-US', iso: 'en-US', name: 'English' },
      { code: 'eo', iso: 'eo', name: 'Esperanto' },
      { code: 'es', iso: 'es', name: 'Español' },
      {
        code: 'es-419',
        iso: 'es-419',
        name: 'Español (América Latina)',
        file: 'es_419.json'
      },
      { code: 'fa', iso: 'fa', name: 'فارسی' },
      { code: 'fi', iso: 'fi', name: 'Suomi' },
      { code: 'fil', iso: 'fil', name: 'Pilipino' },
      { code: 'fr', iso: 'fr-FR', name: 'Français' },
      { code: 'he', iso: 'he', name: 'עברית' },
      { code: 'hi', iso: 'hi', name: 'हिन्दी' },
      { code: 'hu', iso: 'hu', name: 'Magyar' },
      { code: 'id', iso: 'id', name: 'Bahasa Indonesia' },
      { code: 'it', iso: 'it', name: 'Italiano' },
      { code: 'ja', iso: 'ja', name: '日本語' },
      { code: 'kk', iso: 'kk', name: 'қазақ тілі' },
      { code: 'ko', iso: 'ko', name: '한국어' },
      { code: 'lt', iso: 'lt', name: 'Lietuvių kalba' },
      { code: 'ml', iso: 'ml', name: 'മലയാളം' },
      { code: 'ms', iso: 'ms', name: 'بهاس ملايو‎' },
      { code: 'nb', iso: 'nb-NO', name: 'Norsk' },
      { code: 'nl', iso: 'nl', name: 'Nederlands' },
      { code: 'nn', iso: 'nn', name: 'Norsk Nynorsk' },
      { code: 'pa', iso: 'pa', name: 'ਪੰਜਾਬੀ' },
      { code: 'pl', iso: 'pl', name: 'Polski' },
      { code: 'pt', iso: 'pt', name: 'Português' },
      {
        code: 'pt-BR',
        iso: 'pt-BR',
        name: 'Português (Brasil)',
        file: 'pt_BR.json'
      },
      { code: 'ro', iso: 'ro', name: 'Română' },
      { code: 'ru', iso: 'ru', name: 'русский' },
      { code: 'sk', iso: 'sk', name: 'Slovenčina' },
      { code: 'sl', iso: 'sl', name: 'Slovenščina' },
      {
        code: 'sr-Latn',
        iso: 'sr',
        name: 'српски језик',
        file: 'sr_Latn.json'
      },
      { code: 'sv', iso: 'sv', name: 'Svenska' },
      { code: 'sw', iso: 'sw', name: 'Kiswahili' },
      { code: 'ta', iso: 'ta', name: 'தமிழ்' },
      { code: 'tr', iso: 'tr', name: 'Türkçe' },
      { code: 'uk', iso: 'uk', name: 'Українська' },
      { code: 'ur', iso: 'ur', name: 'اردو' },
      { code: 'vi', iso: 'vi', name: 'Tiếng Việt' },
      { code: 'zh-CN', iso: 'zh-CN', name: '简体中文' },
      { code: 'zh-TW', iso: 'zh-TW', name: '繁體中文' }
    ]);

    return {
      locale,
      availableLocales
    };
  }
});
</script>

<style scoped>
.v-list {
  max-height: 31em;
}
</style>
