<template>
  <v-card class="elevation-0" :loading="loading" color="transparent">
    <template #progress>
      <slot name="progress" />
    </template>
    <div class="d-flex justify-space-between">
      <v-card-title
        v-if="pageTitle"
        class="text-overline title"
        v-text="$t(pageTitle)"
      />
      <v-card-actions>
        <slot name="actions" />
        <v-tooltip v-if="!noHelp" bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              :href="helpLink"
              target="_blank"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mdi-help-circle</v-icon>
            </v-btn>
          </template>
          <span>{{ $t('settings.help') }}</span>
        </v-tooltip>
      </v-card-actions>
    </div>
    <v-container class="parent pa-6">
      <slot name="content" />
    </v-container>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    pageTitle: {
      type: String || undefined,
      required: false,
      default: undefined
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
    },
    helpLink: {
      type: String,
      required: false,
      default: ''
    },
    noHelp: {
      type: Boolean,
      required: false,
      default: false
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 1.5em !important;
}

.parent {
  max-width: 100%;
  min-width: 100%;
}
</style>
