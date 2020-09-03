<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col align="center" justify="center" md="4" no-gutters>
        <h1 class="text-h4 mb-6">Login</h1>
        <login-form />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import LoginForm from '../components/LoginForm.vue';

export default {
  layout: 'fullpage',
  components: {
    'login-form': LoginForm
  }
};
</script>
