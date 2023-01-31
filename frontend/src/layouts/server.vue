<template>
  <v-main class="h-100">
    <router-view-transition />
  </v-main>
  <v-footer app color="transparent">
    <locale-switcher top elevated />
  </v-footer>
</template>
