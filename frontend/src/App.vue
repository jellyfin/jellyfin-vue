<template>
  <backdrop />
  <v-app>
    <router-view-transition is-root />
    <snackbar />
  </v-app>
  <player-element />
</template>
