<template>
  <v-dialog
    content-class="metadata-dialog"
    :value="dialog"
    max-width="70%"
    @click:outside="$emit('update:dialog', false)"
  >
    <metadata-editor
      :item-id="itemId"
      :force-refresh.sync="forceRefresh"
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
  data() {
    return {
      forceRefresh: false
    };
  },
  methods: {
    close() {
      this.forceRefresh = true;
      this.$emit('update:dialog', false);
    }
  }
});
</script>

<style>
.metadata-dialog {
  height: 90%;
}
</style>
