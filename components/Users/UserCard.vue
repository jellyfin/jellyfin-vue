<template>
  <v-card class="mx-auto d-flex flex-column">
    <div class="user-image primary darken-4">
      <v-responsive :aspect-ratio="1 / 1">
        <user-image v-if="user.PrimaryImageTag" :id="user.Id" />
        <div
          v-if="!user.PrimaryImageTag"
          class="empty-picture d-flex align-center justify-center"
        >
          <v-icon dark size="96">mdi-account</v-icon>
        </div>
      </v-responsive>
    </div>
    <v-card-title>
      {{ user.Name }}
    </v-card-title>
    <v-card-subtitle class="pb-0 text-capitalize-first-letter">
      {{ formatDistance(user.LastActivityDate) }}
    </v-card-subtitle>
    <v-spacer />
    <v-card-actions>
      <v-btn text block color="primary" @click="$emit('connect', user)">
        {{ $t('connect') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { UserDto } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';
import localeHelper from '~/mixins/localeHelper';

export default Vue.extend({
  mixins: [imageHelper, localeHelper],
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
          locale: this.getDfnsLocale()
        });
      } else {
        return this.$t('never').toString();
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.portrait-card {
  display: block;
  position: relative;
  contain: strict;
}

.card-content {
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 !important;
  height: 100%;
  width: 100%;
  contain: strict;
  -webkit-tap-highlight-color: transparent;
}

.empty-picture {
  height: 100%;
}

.text-capitalize-first-letter::first-letter {
  text-transform: uppercase;
}
</style>
