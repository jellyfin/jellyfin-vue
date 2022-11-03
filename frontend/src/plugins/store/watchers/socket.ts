import { ItemFields } from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import { PiniaPluginContext } from 'pinia';
import { authStore, itemsStore, socketStore, taskManagerStore } from '~/store';
import { TaskType, RunningTask } from '~/store/taskManager';

/**
 * Handle socket messages that are relevant to items inside the items store.
 *
 */
export default function (ctx: PiniaPluginContext): void {
  const auth = authStore();
  const socket = socketStore();
  const items = itemsStore();
  const taskManager = taskManagerStore();

  /**
   * Updates the items in the store after the websocket informs of it. Just a request is enough, as the Axios
   * interceptors already handle updating the item in the store
   *
   * @param itemIds - Ids of the items to update
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
          case 'RefreshProgress':
            // TODO: Verify all the different tasks that this message may belong to - here we assume libraries.

            /* eslint-disable no-case-declarations */
            // @ts-expect-error - No typings for this
            const progress = parseInt(messageData.Progress);
            // @ts-expect-error - No typings for this
            const taskPayload = taskManager.getTask(messageData.ItemId || '');
            const payload: RunningTask = {
              type: TaskType.LibraryRefresh,
              // @ts-expect-error - No typings for this
              id: messageData.ItemId as string,
              progress
            };

            /* eslint-enable no-case-declarations */
            if (taskPayload !== undefined) {
              if (progress >= 0 && progress < 100) {
                payload.data = taskPayload.data;
                taskManager.updateTask(payload);
              } else if (progress >= 0) {
                // @ts-expect-error - No typings for this
                taskManager.finishTask(messageData.ItemId);
              }
            }

            break;
          default:
            break;
        }
      }
    });
  });
}
