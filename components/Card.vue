<template>
  <v-card :to="`../item/${item.Id}`">
    <v-img class="cardImage" :src="imageLink(item.Id)" />
    <v-card-title>
      <span>{{ item.Name }}</span>
    </v-card-title>
    <v-card-subtitle>
      <span>{{ item.ProductionYear }}</span>
    </v-card-subtitle>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    item: {
      type: Object,
      required: true,
      default: () => {
        return {
          Name: 'Missing Name'
        };
      }
    }
  },
  methods: {
    imageLink(id: string) {
      return `${this.$axios.defaults.baseURL}/Items/${id}/Images/Primary`;
    }
  }
});
</script>

<style scoped>
.card {
  width: 12em;
}
</style>
