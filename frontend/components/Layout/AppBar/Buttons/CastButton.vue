<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :transition="'slide-y-transition'"
    bottom
    :nudge-bottom="nudgeBottom"
    offset-y
    min-width="25em"
    max-width="25em"
    min-height="25em"
    max-height="25em"
    :z-index="500"
    class="menu"
  >
    <!-- eslint-disable-next-line vue/no-template-shadow -->
    <template #activator="{ on: menu, attrs }">
      <app-bar-button-layout :custom-listener="menu" v-bind="attrs">
        <template #icon>
          <v-icon>mdi-cast</v-icon>
        </template>
        <template #tooltip>
          <span>{{ $t('remoteDevices') }}</span>
        </template>
      </app-bar-button-layout>
    </template>
    <v-card>
      <v-list color="transparent">
        <v-list-item-group>
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-account-group</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              {{ $t('syncPlayGroups') }}
            </v-list-item-content>
            <v-list-item-action>
              <v-icon>mdi-arrow-right</v-icon>
            </v-list-item-action>
          </v-list-item>
          <v-divider />
          <v-list-item v-if="$features.airPlay">
            <v-list-item-icon>
              <v-icon>mdi-apple-airplay</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              {{ $t('airPlayDevices') }}
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="$features.googleCast">
            <v-list-item-icon>
              <v-icon>mdi-cast</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              {{ $t('googleCastPlaceholderDevice') }}
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-icon>
              <v-icon>$vuetify.icons.jellyfin</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              {{ $t('genericJellyfinPlaceholderDevice') }}
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters, mapState } from 'vuex';

export default Vue.extend({
  props: {
    fab: {
      type: Boolean,
      required: false
    },
    nudgeBottom: {
      type: Number,
      default: 5
    }
  },
  data() {
    return {
      menu: false
    };
  },
  computed: {
    ...mapGetters('playbackManager', ['getCurrentItemSubtitleTracks']),
    ...mapState('playbackManager', ['currentSubtitleStreamIndex'])
  }
});
</script>
