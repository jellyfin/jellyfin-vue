<template>
  <div class="ma-2 d-flex flex-column pointer" @click="$emit('connect', user)">
    <v-btn variant="plain" ripple :height="128" :width="128">
      <user-image :size="128" :user="user" rounded />
    </v-btn>
    <a class="text-subtitle-1 text-center mt-2 link">
      {{ user.Name }}
    </a>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { UserDto } from '@jellyfin/client-axios';

export default defineComponent({
  props: {
    user: {
      type: Object as () => UserDto,
      required: true
    }
  },
  methods: {
    formatDistance(value: string): string {
      return value
        ? this.$dateFns.formatDistanceToNow(new Date(value), {
            addSuffix: true,
            locale: this.$i18n.locale
          })
        : this.$t('never');
    }
  }
});
</script>
