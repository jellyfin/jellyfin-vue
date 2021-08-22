<template>
  <v-container>
    <v-row v-if="pageTitle">
      <v-col>
        <v-row class="mx-0 mt-4 mb-2 justify-space-between">
          <h2 class="text-h4">
            {{ $t(pageTitle) }}
          </h2>
          <div>
            <slot name="actions" />
          </div>
        </v-row>
      </v-col>
    </v-row>
    <v-row>
      <slot name="content" />
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    pageTitle: {
      type: String || undefined,
      required: false,
      default: undefined
    }
  }
});
</script>
