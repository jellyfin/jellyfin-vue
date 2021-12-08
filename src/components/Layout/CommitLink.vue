<template>
  <v-list-item
    v-if="commit"
    :href="'https://github.com/jellyfin/jellyfin-vue/commit/' + commit"
  >
    <v-list-item-action>
      <v-icon>mdi-github</v-icon>
    </v-list-item-action>
    <v-list-item-content>
      <v-list-item-title v-text="'#' + commit.substring(0, 6)" />
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  computed: {
    commit() {
      return process.env.NUXT_ENV_COMMIT;
    }
  }
});
</script>
