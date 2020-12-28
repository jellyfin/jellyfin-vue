<template>
  <div v-if="!$nuxt.isOnline">
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-icon size="32" v-bind="attrs" v-on="on">
          mdi-network-off-outline
        </v-icon>
      </template>
      <span>{{ $t('noNetworkConnection') }}</span>
    </v-tooltip>
  </div>
</template>
