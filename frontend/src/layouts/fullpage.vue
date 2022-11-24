<template>
  <v-app>
    <v-main>
      <router-view-transition />
    </v-main>
    <v-footer app color="rgba(0, 0, 0, 0)">
      <locale-switcher large top />
    </v-footer>
  </v-app>
</template>
