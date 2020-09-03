<template>
  <v-menu offset-y>
    <template v-slot:activator="{ on, attrs }">
      <v-avatar color="grey darken-2" size="36" v-bind="attrs" v-on="on">
        <v-icon dark>mdi-account</v-icon>
      </v-avatar>
    </template>
    <v-list>
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="index"
        @click="item.action"
      >
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
export default {
  data() {
    return {
      userAvatar: false,
      menuItems: [
        {
          title: 'Logout',
          action: () => {
            this.$auth.logout();
          }
        }
      ]
    };
  }
};
</script>
