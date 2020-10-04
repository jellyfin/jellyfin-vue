<template>
  <v-card>
    <v-card-title class="headline">{{ $t('editMetadata') }}</v-card-title>
    <v-card-text></v-card-text>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    person: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      editState: {}
    };
  },
  created() {
    this.editState = this.person;
  },
  methods: {
    handleSubmit(value) {
      this.$emit('update:person', value);
    }
  }
});
</script>
