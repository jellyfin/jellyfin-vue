<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <v-btn
        v-if="!$vuetify.breakpoint.smAndDown && items[model]"
        class="my-2"
        text
        rounded
        v-bind="attrs"
        v-on="on"
      >
        {{ items[model].name }}
        <v-icon right>mdi-menu-down</v-icon>
      </v-btn>
      <v-btn v-else class="my-2" icon v-bind="attrs" v-on="on">
        <v-icon>mdi-eye</v-icon>
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
  props: {
    type: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      model: 0
    };
  },
  computed: {
    items(): Array<Record<string, string>> {
      switch (this.type) {
        case 'movies':
          return [
            { name: this.$t('movies').toString(), value: 'Movie' },
            { name: this.$t('collections').toString(), value: 'BoxSet' },
            { name: this.$t('actors').toString(), value: 'Actor' },
            { name: this.$t('genres').toString(), value: 'Genre' },
            { name: this.$t('studios').toString(), value: 'Studio' }
          ];
        case 'music':
          return [
            { name: this.$t('albums').toString(), value: 'MusicAlbum' },
            { name: this.$t('artists').toString(), value: 'MusicArtist' },
            { name: this.$t('genres').toString(), value: 'MusicGenre' }
          ];
        case 'tvshows':
          return [
            { name: this.$t('series').toString(), value: 'Series' },
            { name: this.$t('actors').toString(), value: 'Actor' },
            { name: this.$t('genres').toString(), value: 'Genre' },
            { name: this.$t('networks').toString(), value: 'Studio' }
          ];
        default:
          return [];
      }
    }
  }
});
</script>
