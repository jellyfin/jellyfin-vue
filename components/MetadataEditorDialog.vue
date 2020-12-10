<template>
  <v-dialog
    :value="dialog"
    max-width="80%"
    @click:outside="$emit('update:dialog', false)"
  >
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
