<template>
  <backdrop />
  <v-app>
    <router-view-transition is-root />
    <snackbar />
    <confirm-dialog />
  </v-app>
  <player-element />
</template>
