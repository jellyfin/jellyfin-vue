<template>
  <AppBarButtonLayout disabled>
    <template #icon>
      <VIcon>
        <IMdiCast />
      </VIcon>
      <VMenu
        v-model="menu"
        :close-on-content-click="false"
        :transition="'slide-y-transition'"
        location="bottom"
        :z-index="500">
        <VCard>
          <VList color="transparent">
            <VListItem>
              <VIcon>
                <IMdiAccountGroup />
              </VIcon>
              {{ $t('syncPlayGroups') }}
              <VListItemAction>
                <VIcon>
                  <IMdiArrowRight />
                </VIcon>
              </VListItemAction>
            </VListItem>
            <VDivider />
            <VListItem>
              <VIcon>
                <IMdiAppleAirplay />
              </VIcon>
              {{ $t('airPlayDevices') }}
            </VListItem>
            <VListItem>
              <VIcon>
                <IMdiCast />
              </VIcon>
              {{ $t('googleCastPlaceholderDevice') }}
            </VListItem>
            <VListItem>
              <VIcon>
                <ISimpleIconsJellyfin />
              </VIcon>
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
