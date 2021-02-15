<template>
  <v-dialog
    content-class="metadata-dialog"
    :value="dialog"
    :fullscreen="$vuetify.breakpoint.mobile"
    width="50vw"
    scrollable
    @click:outside="$emit('update:dialog', false)"
  >
    <identify-item :item="item" />
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    dialog: {
      type: Boolean,
      required: true
    },
    item: {
      type: Object as () => BaseItemDto,
      default: {}
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
