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
        v-for="(item, index) in $i18n.locales"
        :key="index"
        :input-value="item.code === $i18n.locale"
        @click="setLocale({ locale: item.code })"
      >
        <v-list-item-title>{{ item.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
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
  methods: {
    ...mapActions('settings', ['setLocale'])
  }
});
</script>
<style scoped>
.v-list {
  max-height: 31em;
}
</style>
