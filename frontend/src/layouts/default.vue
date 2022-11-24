<template>
  <v-app>
    <backdrop />
    <navigation-drawer />
    <app-bar />
    <v-main>
      <div class="pa-s">
        <router-view-transition />
      </div>
    </v-main>
    <audio-controls />
  </v-app>
</template>
