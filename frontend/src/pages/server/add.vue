<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col sm="6" md="6" lg="5">
        <h1 class="text-h4 mb-6 text-center">
          {{ $t('login.addServer') }}
        </h1>
        <add-server-form />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { pageStore } from '~/store';

export default defineComponent({
  layout: 'fullpage',
  head() {
    return {
      title: this.page.title
    };
  },
  computed: {
    ...mapStores(pageStore)
  },
  mounted() {
    this.page.title = this.$t('login.addServer');
  }
});
</script>
