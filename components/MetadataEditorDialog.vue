<template>
  <v-dialog v-model="dialog" max-width="60%">
    <metadata-editor
      :item-id="itemId"
      @cancel="close"
      @save="close"
    ></metadata-editor>
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
    itemId: {
      type: String,
      default: ''
    }
  },
  methods: {
    close() {
      this.$emit('update:dialog', false);
    }
  }
});
</script>
