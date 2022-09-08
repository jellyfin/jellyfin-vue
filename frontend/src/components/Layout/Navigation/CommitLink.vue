<template>
  <v-list-item
    v-if="commit"
    :href="'https://github.com/jellyfin/jellyfin-vue/commit/' + commit"
    target="_blank"
    rel="noopener noreferrer"
  >
    <v-list-item-action>
      <i-mdi-github />
    </v-list-item-action>
    <v-list-item-content>
      <v-list-item-title v-text="'#' + commit.substring(0, 7)" />
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  computed: {
    commit() {
      return __COMMIT_HASH__;
    }
  }
});
</script>
