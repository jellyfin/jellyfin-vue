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
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  props: {
    color: {
      type: String,
      required: false,
      default: ''
    },
    customListener: {
      type: Object as () => EventTarget,
      required: false,
      default: undefined
    }
  },
  computed: {
    ...mapState('page', ['opaqueAppBar', 'isScrolled']),
    fab(): boolean {
      return !this.opaqueAppBar && !this.isScrolled;
    }
  }
});
</script>
