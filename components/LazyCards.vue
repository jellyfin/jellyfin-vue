<template>
  <div class="lazyScroll">
    <card
      :item="item"
      :shape="shape"
      :episode="episode"
      :overlay="overlay"
      :no-text="noText"
      :no-margin="noMargin"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '~/api';

export default Vue.extend({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    shape: {
      type: [String, Boolean],
      default: () => {
        return false;
      }
    },
    episode: {
      type: Boolean,
      default: () => {
        return false;
      }
    },
    overlay: {
      type: Boolean,
      default: () => {
        return true;
      }
    },
    noText: {
      type: Boolean,
      default: () => {
        return false;
      }
    },
    noMargin: {
      type: Boolean,
      default: () => {
        return false;
      }
    }
  }
});
</script>
