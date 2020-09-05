<template>
  <v-menu offset-y>
    <template v-slot:activator="{ on, attrs }">
      <v-avatar color="grey darken-2" size="36" v-bind="attrs" v-on="on">
        <v-img v-if="userImage" :src="userImage" :alt="$auth.user.name"></v-img>
        <v-icon v-else dark>mdi-account</v-icon>
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
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      menuItems: [
        {
          title: 'Logout',
          action: () => {
            this.$auth.logout();
            this.$user.clear();
          }
        }
      ]
    };
  },
  computed: {
    userImage: {
      get() {
        if (this.$auth.user?.PrimaryImageTag) {
          return `${this.$axios.defaults.baseURL}/Users/${this.$auth.user.Id}/Images/Primary/?tag=${this.$auth.user.PrimaryImageTag}&maxWidth=36`;
        } else {
          return '';
        }
      }
    }
  }
});
</script>
