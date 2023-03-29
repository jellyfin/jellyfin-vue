<template>
  <app-bar-button-layout disabled>
    <template #icon>
      <v-icon>
        <i-mdi-cast />
      </v-icon>
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        :transition="'slide-y-transition'"
        location="bottom"
        :z-index="500"
        activator="parent">
        <v-card>
          <v-list color="transparent">
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
            <v-list-item>
              <v-icon>
                <i-mdi-apple-airplay />
              </v-icon>
              {{ $t('airPlayDevices') }}
            </v-list-item>
            <v-list-item>
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
          </v-list>
        </v-card>
      </v-menu>
    </template>
    <template #tooltip>
      <span>{{ $t('remoteDevices') }}</span>
    </template>
  </app-bar-button-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const menu = ref(false);
</script>
