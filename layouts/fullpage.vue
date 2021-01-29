<template>
  <v-app>
    <v-main>
      <nuxt />
    </v-main>
    <v-footer app color="rgba(0, 0, 0, 0)">
      <locale-switcher large top />
    </v-footer>
    <snackbar />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  beforeMount() {
    this.$store.watch(
      (_state, getters) => getters['displayPreferences/getLocale'],
      (locale: string) => {
        if (locale !== 'auto') this.$i18n.setLocale(locale);
        else
          this.$i18n.setLocale(
            this.$i18n.getBrowserLocale() || this.$i18n.defaultLocale || 'en'
          );
      }
    );
  }
});
</script>
