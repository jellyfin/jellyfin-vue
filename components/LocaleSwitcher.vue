<template>
  <v-menu offset-y>
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon size="36" v-bind="attrs" v-on="on">
        <v-icon>mdi-web</v-icon>
      </v-btn>
    </template>
    <v-list class="overflow-y-auto">
      <v-list-item
        v-for="(item, index) in $i18n.locales"
        :key="index"
        :input-value="item.code === $i18n.locale"
        @click="$i18n.setLocale(item.code)"
      >
        <v-list-item-title>{{ item.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<style scoped>
.v-list {
  max-height: 31em;
}
</style>