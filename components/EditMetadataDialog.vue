<template>
  <v-dialog v-model="dialog" max-width="290">
    <edit-metadata></edit-metadata>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    dialog: {
      type: Boolean,
      required: true,
      default: false
    },
    metadata: {
      type: Object,
      default: () => ({})
    }
  }
});
</script>
