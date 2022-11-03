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
    class="menu">
    <!-- eslint-disable-next-line vue/no-template-shadow -->
    <template #activator="{ on: menu, attrs }">
      <app-bar-button-layout :custom-listener="menu" v-bind="attrs" disabled>
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
            <v-icon>mdi-account-group</v-icon>
            {{ $t('syncPlayGroups') }}
            <v-list-item-action>
              <v-icon>mdi-arrow-right</v-icon>
            </v-list-item-action>
          </v-list-item>
          <v-divider />
          <v-list-item v-if="$features.airPlay">
            <v-icon>mdi-apple-airplay</v-icon>
            {{ $t('airPlayDevices') }}
          </v-list-item>
          <v-list-item v-if="$features.googleCast">
            <v-icon>mdi-cast</v-icon>
            {{ $t('googleCastPlaceholderDevice') }}
          </v-list-item>
          <v-list-item>
            <v-icon>$vuetify.icons.jellyfin</v-icon>
            {{ $t('genericJellyfinPlaceholderDevice') }}
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
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
  }
});
</script>
