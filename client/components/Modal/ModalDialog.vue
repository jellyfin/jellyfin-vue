<template>
  <v-dialog
    content-class="metadata-dialog"
    :v-model="dialog"
    :width="modalWidth"
    :max-width="largeModalWidth"
    :fullscreen="$vuetify.breakpoint.mobile"
    @click:outside="$emit('input', false)"
  >
    <v-card>
      <slot name="header">
        <v-card-title v-text="title" />
        <v-card-subtitle v-if="subtitle" class="pb-3" v-text="subtitle" />
      </slot>

      <v-divider />

      <slot />

      <v-divider />
      <v-card-actions class="d-flex justify-end">
        <slot name="footer">
          <v-btn
            depressed
            width="8em"
            color="primary"
            class="mr-1"
            @click="$emit('input', false)"
          >
            {{ $t('close') }}
          </v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import modalHelper from '~/mixins/modalHelper';

export default Vue.extend({
  mixins: [modalHelper],
  model: {
    prop: 'dialog',
    event: 'input'
  },
  props: {
    dialog: {
      type: Boolean
    },
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    small: {
      type: Boolean
    },
    large: {
      type: Boolean
    },
    xLarge: {
      type: Boolean
    }
  },
  computed: {
    modalWidth(): string | number {
      if (this.small) {
        return this.smallModalWidth;
      } else if (this.large) {
        return this.largeModalWidth;
      } else if (this.xLarge) {
        return this.extraLargeModalWidth;
      } else {
        return this.defaultModalWidth;
      }
    }
  }
});
</script>
