<template>
  <div class="ma-1">
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          class="align-self-center active-button"
          :icon="!fab"
          :fab="fab"
          :small="fab"
          :class="{ 'ma-n1': !fab }"
          :color="color"
          :disabled="disabled"
          v-bind="attrs"
          v-on="$slots.tooltip ? { ...on, ...customListener } : customListener"
        >
          <slot name="icon" />
        </v-btn>
      </template>
      <slot name="tooltip" />
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { pageStore } from '~/store';

export default defineComponent({
  props: {
    color: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    customListener: {
      type: Object as () => EventTarget,
      default: undefined
    }
  },
  computed: {
    ...mapStores(pageStore),
    fab(): boolean {
      return (
        !(!this.page.transparentLayout || this.$vuetify.breakpoint.xsOnly) &&
        !this.page.isScrolled
      );
    }
  }
});
</script>
