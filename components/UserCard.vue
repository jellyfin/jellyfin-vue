<template>
  <div class="portrait-card">
    <div class="card-content">
      <v-card
        class="mx-auto d-flex flex-column"
        height="100%"
        max-height="325px"
        max-width="200px"
      >
        <div class="user-image primary darken-4">
          <v-responsive :aspect-ratio="1 / 1">
            <v-img
              v-if="user.PrimaryImageTag"
              :src="`${$axios.defaults.baseURL}/Users/${user.Id}/Images/Primary?tag=${user.PrimaryImageTag}&quality=90`"
            />
            <div
              v-if="!user.PrimaryImageTag"
              class="empty-picture d-flex align-center justify-center"
            >
              <v-icon size="96"> mdi-account </v-icon>
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
          <v-btn
            text
            color="primary"
            width="100%"
            @click="$emit('connect', user)"
          >
            {{ $t('connect') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import imageHelper from '~/mixins/imageHelper';
import { UserDto } from '~/api';

export default Vue.extend({
  mixins: [imageHelper],
  props: {
    user: {
      type: Object as () => UserDto,
      required: true
    }
  },
  methods: {
    formatDistance(value: string) {
      if (value) {
        return this.$dateFns.formatDistanceToNow(new Date(value), {
          addSuffix: true
        });
      } else {
        return '';
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.portrait-card {
  display: inline-block;
  width: 200px;
  height: 325px;
  position: relative;
  contain: strict;
  border-radius: 0.3em;
  margin: 0.6em;
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
