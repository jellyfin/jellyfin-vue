<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition"
    offset-y
  >
    <template #:activator="{ on, attrs }">
      <v-text-field
        :value="value"
        :label="label"
        readonly
        outlined
        v-bind="attrs"
        v-on="on"
      />
    </template>
    <v-date-picker :value="value" @change="handleChange" />
  </v-menu>
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    value: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      menu: false
    };
  },
  methods: {
    handleChange(value: string): void {
      this.menu = false;
      this.$emit('update:date', value);
    }
  }
});
</script>
