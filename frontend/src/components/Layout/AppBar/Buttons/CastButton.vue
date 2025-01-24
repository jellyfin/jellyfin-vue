<template>
  <AppBarButtonLayout disabled>
    <template #icon>
      <JIcon class="i-mdi:cast" />
      <VMenu
        v-model="menu"
        :close-on-content-click="false"
        :transition="'slide-y-transition'"
        location="bottom"
        :z-index="500">
        <VCard>
          <VList color="transparent">
            <VListItem>
              <JIcon class="i-mdi:account-group" />
              {{ $t('syncPlayGroups') }}
              <VListItemAction>
                <JIcon class="i-mdi:arrow-right" />
              </VListItemAction>
            </VListItem>
            <VDivider />
            <VListItem>
              <JIcon class="i-mdi:apple-airplay" />
              {{ $t('airPlayDevices') }}
            </VListItem>
            <VListItem>
              <JIcon class="i-mdi:cast" />
              {{ $t('googleCastPlaceholderDevice') }}
            </VListItem>
            <VListItem>
              <JIcon class="i-simple-icons:jellyfin" />
              {{ $t('genericJellyfinPlaceholderDevice') }}
            </VListItem>
          </VList>
        </VCard>
      </VMenu>
    </template>
    <template #tooltip>
      <span>{{ $t('remoteDevices') }}</span>
    </template>
  </AppBarButtonLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const menu = ref(false);
</script>
