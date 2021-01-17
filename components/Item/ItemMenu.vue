<template>
  <div v-if="items.length > 0">
    <v-menu absolute close-on-click close-on-content-click>
      <template #activator="{ on, attrs }">
        <v-btn
          :class="absolute ? 'card-more-button' : ''"
          icon
          small
          :outlined="outlined"
          :dark="dark"
          v-bind="attrs"
          v-on="on"
          @click.stop.prevent
        >
          <v-icon>mdi-dots-horizontal</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(menuItem, index) in items"
          :key="`item-${item.Id}-menu-${index}`"
          @click="menuItem.action"
        >
          <v-list-item-title>{{ menuItem.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <metadata-editor-dialog :dialog.sync="dialog" :item-id="item.Id" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto } from '@jellyfin/client-axios';
import itemHelper from '~/mixins/itemHelper';

type MenuItem = {
  title: string;
  action: () => void;
};

export default Vue.extend({
  mixins: [itemHelper],
  props: {
    item: {
      type: Object,
      default: (): BaseItemDto => {
        return {};
      }
    },
    absolute: {
      type: Boolean,
      default: true
    },
    dark: {
      type: Boolean,
      default: true
    },
    outlined: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      dialog: false
    };
  },
  computed: {
    items: {
      get(): MenuItem[] {
        const menuItems = [] as MenuItem[];

        if (this.canResume(this.item)) {
          menuItems.push({
            title: this.$t('playFromBeginning'),
            action: () => {
              this.play({
                items: [this.item]
              });
            }
          });
        }

        if (this.$auth.user?.Policy?.IsAdministrator) {
          menuItems.push({
            title: this.$t('editMetadata'),
            action: () => {
              this.dialog = true;
            }
          });
        }

        if (
          this.$auth.user?.Policy?.IsAdministrator &&
          ['Folder', 'CollectionFolder', 'UserView'].includes(
            this.item.Type || ''
          )
        ) {
          menuItems.push({
            title: this.$t('refreshLibrary'),
            action: async () => {
              try {
                await this.$api.itemRefresh.post({
                  itemId: this.item.Id,
                  replaceAllImages: false,
                  replaceAllMetadata: false
                });

                this.pushSnackbarMessage({
                  message: this.$t('libraryRefreshQueued'),
                  color: 'normal'
                });
              } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);

                this.pushSnackbarMessage({
                  message: this.$t('unableToRefreshLibrary'),
                  color: 'error'
                });
              }
            }
          });
        }

        return menuItems;
      }
    }
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    ...mapActions('playbackManager', ['play'])
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
