<template>
  <server-info-card />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  middleware: 'adminMiddleware'
});
</script>
