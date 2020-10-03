<template>
  <div>
    <v-menu absolute>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          class="card-more-button"
          icon
          smal
          v-bind="attrs"
          v-on="on"
          @click.stop.prevent
        >
          <v-icon>mdi-dots-horizontal</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          @click="item.action"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <edit-metadata-dialog :dialog="dialog" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      dialog: false
    };
  },
  computed: {
    items: {
      get() {
        return [
          {
            title: this.$t('editMetadata'),
            action: () => {
              this.dialog = true;
            }
          }
        ];
      }
    }
  }
});
</script>

<style scoped>
.card-more-button {
  position: absolute;
  right: 0.5em;
  bottom: 0.5em;
}
</style>
