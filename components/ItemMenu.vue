<template>
  <div>
    <v-menu absolute>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          class="card-more-button"
          icon
          small
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
    <metadata-editor-dialog :dialog.sync="dialog" :item-id="itemId" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

type IMenuItem = {
  title: string;
  action: () => void;
};
export default Vue.extend({
  props: {
    itemId: { type: String, default: '' }
  },
  data() {
    return {
      dialog: false
    };
  },
  computed: {
    items: {
      get(): IMenuItem[] {
        return [
          {
            title: this.$t('editMetadata') as string,
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
