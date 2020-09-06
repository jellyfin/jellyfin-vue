<template>
  <v-menu offset-y>
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon size="36" v-bind="attrs" v-on="on">
        <v-icon>mdi-web</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="index"
        :input-value="item.code === $i18n.locale"
        @click="$i18n.setLocale(item.code)"
      >
        <v-list-item-title>{{ item.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  computed: {
    menuItems: {
      get() {
        return this.$i18n.locales;
      }
    }
  }
});
</script>
