<template>
  <v-dialog
    content-class="metadata-dialog"
    :value="dialog"
    :fullscreen="$vuetify.breakpoint.mobile"
    width="50vw"
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
      required: true
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
    close(): void {
      this.forceRefresh = true;
      this.$emit('update:dialog', false);
    }
  }
});
</script>

<style>
.metadata-dialog {
  height: 60vh;
}
</style>
