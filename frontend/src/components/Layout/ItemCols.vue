<template>
  <v-container class="px-6">
    <v-row>
      <v-col cols="12" sm="8" md="9">
        <slot name="left" />
      </v-col>
      <v-col cols="12" sm="4" md="3">
        <slot name="right" />
      </v-col>
    </v-row>
  </v-container>
</template>
