import { ItemFields } from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import { authStore, itemsStore, socketStore } from '~/store';

/**
 * Handle socket messages that are relevant to items inside the items store.
 *
 * @param ctx
 */
export default function watchSocket(ctx: Context): void {
  const auth = authStore();
  const socket = socketStore();
  const items = itemsStore();

  /**
   * Updates the items in the store after the websocket informs of it. Just a request is enough, as the Axios
   * interceptors already handle updating the item in the store
   *
   * @param {string[]} itemIds - Ids of the items to update
   */
  async function updateStoreItems(itemIds: string[]): Promise<void> {
    if (itemIds.length) {
      await ctx.$api.items.getItems({
        userId: auth.currentUserId,
        ids: itemIds,
        fields: Object.keys(ItemFields) as ItemFields[]
      });
    }
  }

  /**
   * Watch just the setMessage action in the socket store
   */
  socket.$onAction(({ name, after, store }) => {
    after(() => {
      if (name === 'setMessage') {
        const messageType = store.messageType;
        const messageData = store.messageData;
        let itemsToUpdate: string[];

        switch (messageType) {
          case 'ForceKeepAlive': // Keep the websocket alive
            socket.sendToSocket('KeepAlive');
            break;
          case 'LibraryChanged': // Update items when metadata changes
            // @ts-expect-error -- The Data property doesn't describe its content
            itemsToUpdate = messageData.ItemsUpdated.filter(
              (itemId: string) => {
                return Object.keys(items.byId).includes(itemId);
              }
            );

            updateStoreItems(itemsToUpdate);
            break;
          case 'UserDataChanged': // Update items when their userdata is changed (like, mark as watched, etc)
            // @ts-expect-error -- The Data property doesn't describe its content
            itemsToUpdate = messageData.UserDataList.filter(
              (updatedData: never) => {
                // @ts-expect-error -- There are no typings for websocket returned data.
                const itemId = updatedData.ItemId as string;

                return Object.keys(items.byId).includes(itemId);
              }
            ).map((updatedData: never) => {
              // @ts-expect-error -- There are no typings for websocket returned data.
              return updatedData.ItemId as string;
            });

            updateStoreItems(itemsToUpdate);
            break;
          default:
            break;
        }
      }
    });
  });
}
