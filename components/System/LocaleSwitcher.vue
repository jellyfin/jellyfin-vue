<template>
  <v-menu offset-y>
    <template #activator="{ on: onMenu, attrs: attrsMenu }">
      <v-tooltip bottom>
        <template #activator="{ on: onTooltip, attrsTooltip }">
          <v-btn
            :icon="!fab"
            :fab="fab"
            :small="fab"
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
        v-for="item in locales"
        :key="item.code"
        :input-value="
          item.code === $store.state.displayPreferences.CustomPrefs.locale
        "
        @click="editCustomPref({ key: 'locale', value: item.code })"
      >
        <v-list-item-title>{{ item.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<script lang="ts">
import { NuxtVueI18n } from 'nuxt-i18n/types/nuxt-i18n';
import Vue from 'vue';
import { mapActions } from 'vuex';

interface LocalesSelect {
  code: string;
  name: string;
}

export default Vue.extend({
  props: {
    fab: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    locales: {
      get(): LocalesSelect[] {
        if (!this.$i18n.locales) return [];
        const res: LocalesSelect[] = (this.$i18n
          .locales as NuxtVueI18n.Options.LocaleObject[]).map((el) => {
          return { code: el.code, name: el.name };
        });
        res.unshift({
          code: 'auto',
          name: `${this.$t('auto')} (${this.getLocaleCodeName(
            this.$i18n.getBrowserLocale()
          )})`
        });
        return res;
      }
    }
  },
  methods: {
    ...mapActions('displayPreferences', ['editCustomPref']),
    getLocaleCodeName(code: string | undefined): string {
      if (!this.$i18n.locales || !code) return '';
      const res = (this.$i18n
        .locales as NuxtVueI18n.Options.LocaleObject[]).find(
        (el) => el.code === code
      );
      return res ? res.name : '';
    }
  }
});
</script>
<style scoped>
.v-list {
  max-height: 31em;
}
</style>
