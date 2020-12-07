<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <v-btn
        v-if="!$vuetify.breakpoint.smAndDown"
        class="my-2"
        text
        rounded
        v-bind="attrs"
        v-on="on"
      >
        {{ $t('sortByType', { type: items[model].name }) }}
        <v-icon right> mdi-menu-down </v-icon>
      </v-btn>
      <v-btn v-else class="my-2" icon v-bind="attrs" v-on="on">
        <v-icon>mdi-sort-alphabetical-ascending</v-icon>
      </v-btn>
    </template>
    <v-list dense>
      <v-list-item-group
        v-model="model"
        @change="$emit('change', items[model].value)"
      >
        <v-list-item v-for="item in items" :key="item.value">
          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      items: [
        { name: this.$t('name'), value: 'SortName', order: false },
        { name: this.$t('rating'), value: 'CommunityRating', order: false },
        { name: this.$t('releaseDate'), value: 'PremiereDate', order: false }
      ],
      model: 0
    };
  }
});
</script>
