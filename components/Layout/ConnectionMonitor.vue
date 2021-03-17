<template>
  <div
    v-if="$nuxt.isOffline"
    class="w-100 pa-3 d-flex flex-row justify-center align-center"
  >
    <v-icon class="mr-2" size="24"> mdi-network-off-outline </v-icon>
    <span>{{ $t('noNetworkConnection') }}</span>
  </div>
</template>
