<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :transition="'slide-y-transition'"
    location="bottom"
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
          <v-icon>
            <i-mdi-cast />
          </v-icon>
        </template>
        <template #tooltip>
          <span>{{ $t('remoteDevices') }}</span>
        </template>
      </app-bar-button-layout>
    </template>
    <v-card>
      <v-list color="transparent">
        <v-list-group>
          <v-list-item>
            <v-icon>
              <i-mdi-account-group />
            </v-icon>
            {{ $t('syncPlayGroups') }}
            <v-list-item-action>
              <v-icon>
                <i-mdi-arrow-right />
              </v-icon>
            </v-list-item-action>
          </v-list-item>
          <v-divider />
          <v-list-item v-if="features.airPlay">
            <v-icon>
              <i-mdi-apple-airplay />
            </v-icon>
            {{ $t('airPlayDevices') }}
          </v-list-item>
          <v-list-item v-if="features.googleCast">
            <v-icon>
              <i-mdi-cast />
            </v-icon>
            {{ $t('googleCastPlaceholderDevice') }}
          </v-list-item>
          <v-list-item>
            <v-icon>
              <i-simple-icons-jellyfin />
            </v-icon>
            {{ $t('genericJellyfinPlaceholderDevice') }}
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import supportedFeatures from '@/utils/supported-features';

withDefaults(
  defineProps<{
    fab?: boolean;
    nudgeBottom?: number;
  }>(),
  {
    nudgeBottom: 5
  }
);

const menu = ref(false);

const features = supportedFeatures;
</script>
