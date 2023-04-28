<template>
  <backdrop />
  <v-app v-focus-section:app>
    <router-view-transition is-root />
    <snackbar />
    <confirm-dialog />
  </v-app>
  <player-element />
</template>
