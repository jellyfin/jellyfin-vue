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
          <Icon>
            <i-mdi-cast />
          </Icon>
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
            <Icon>
              <i-mdi-account-group />
            </Icon>
            {{ $t('syncPlayGroups') }}
            <v-list-item-action>
              <Icon>
                <i-mdi-arrow-right />
              </Icon>
            </v-list-item-action>
          </v-list-item>
          <v-divider />
          <v-list-item v-if="features.airPlay">
            <Icon>
              <i-mdi-apple-airplay />
            </Icon>
            {{ $t('airPlayDevices') }}
          </v-list-item>
          <v-list-item v-if="features.googleCast">
            <Icon>
              <i-mdi-cast />
            </Icon>
            {{ $t('googleCastPlaceholderDevice') }}
          </v-list-item>
          <v-list-item>
            <Icon>
              <i-simple-icons-jellyfin />
            </Icon>
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

defineProps({
  fab: {
    type: Boolean,
    required: false
  },
  nudgeBottom: {
    type: Number,
    default: 5
  }
});

const menu = ref(false);

const features = supportedFeatures;
</script>
