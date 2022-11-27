<template>
  <v-app>
    <v-main>
      <router-view-transition />
    </v-main>
    <v-footer app color="background">
      <locale-switcher top />
    </v-footer>
  </v-app>
</template>
