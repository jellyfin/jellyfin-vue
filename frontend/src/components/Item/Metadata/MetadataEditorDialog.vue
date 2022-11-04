<template>
  <v-dialog
    content-class="metadata-dialog"
    :model-value="dialog"
    :fullscreen="$vuetify.display.mobile"
    width="50vw"
    @click:outside="$emit('update:dialog', false)">
    <metadata-editor
      v-model:force-refresh="forceRefresh"
      :item-id="itemId"
      @cancel="close"
      @save="close" />
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
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

<style lang="scss" scoped>
.metadata-dialog {
  height: 60vh;
}
</style>
