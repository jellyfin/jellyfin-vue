<template>
  <div
    class="user-card mx-auto d-flex flex-column"
    @click="$emit('connect', user)"
  >
    <user-image :size="128" :user="user" />
    <span class="text-subtitle-1 text-center mt-2">{{ user.Name }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { UserDto } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [imageHelper],
  props: {
    user: {
      type: Object as () => UserDto,
      required: true
    }
  },
  methods: {
    formatDistance(value: string): string {
      if (value) {
        return this.$dateFns.formatDistanceToNow(new Date(value), {
          addSuffix: true,
          locale: this.$i18n.locale
        });
      } else {
        return this.$t('never');
      }
    }
  }
});
</script>
