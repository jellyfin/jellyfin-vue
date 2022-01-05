import { BaseItemDto } from '@jellyfin/client-axios';
import destr from 'destr';
import { Plugin } from 'vuex';
import { AppState } from '..';
import { WebSocketMessage } from '../socket';
import { TaskType, RunningTask } from '../taskManager';

export const websocketPlugin: Plugin<AppState> = (store) => {
  /**
   * Builds and sends a websocket message of a given type, with the specified payload.
   *
   * @param {string} name - Name of the message type to send
   * @param {Record<string, any>} data - Contents of the payload of the message
   */
  function sendWebsocketMessage(
    name: string,
    data?: Record<string, never>
  ): void {
    const msg: WebSocketMessage = {
      MessageType: name,
      ...(data ? { Data: data } : {})
    };

    store.dispatch('socket/sendToSocket', { message: msg });
  }

  /**
   * Updates the items in the store after the websocket informs of it
   *
   * @param {string[]} itemIds - Ids of the items to update
   */
  async function updateStoreItems(itemIds: string[]): Promise<void> {
    if (itemIds.length) {
      const updatedItems: BaseItemDto[] =
        (
          await store.$api.items.getItems({
            userId: store.$auth.user?.Id,
            ids: itemIds
          })
        ).data.Items || [];

      store.dispatch('items/addItems', { items: updatedItems });
    }
  }

  store.subscribe(async (mutation, state) => {
    const messageType = state.socket.messageType;
    const messageData = destr(state.socket.messageData);
    const storeIds = store.state.items.allIds;
    let itemsToUpdate: string[];

    if (mutation.type === 'socket/ONMESSAGE') {
      switch (messageType) {
        case 'ForceKeepAlive': // Keep the websocket alive
          sendWebsocketMessage('KeepAlive');
          break;
        case 'LibraryChanged': // Update items when metadata changes
          itemsToUpdate = messageData.ItemsUpdated.filter((itemId: string) => {
            return storeIds.includes(itemId);
          });

          updateStoreItems(itemsToUpdate);
          break;
        case 'UserDataChanged': // Update items when their userdata is changed (like, mark as watched, etc)
          itemsToUpdate = messageData.UserDataList.filter(
            (updatedData: never) => {
              // @ts-expect-error -- There are no typings for websocket returned data.
              const itemId = updatedData.ItemId as string;

              return storeIds.includes(itemId);
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
          const progress = parseInt(messageData.Progress);
          const taskPayload: RunningTask = store.getters['taskManager/getTask'](
            messageData.ItemId
          );
          const payload: RunningTask = {
            type: TaskType.LibraryRefresh,
            id: messageData.ItemId as string,
            progress
          };
          /* eslint-enable no-case-declarations */

          if (taskPayload !== undefined) {
            if (progress >= 0 && progress < 100) {
              payload.data = taskPayload.data;
              store.dispatch('taskManager/updateTask', {
                id: payload.id,
                newPayload: payload
              });
            } else if (progress >= 0) {
              store.dispatch('taskManager/finishTask', messageData.ItemId);
            }
          }

          break;
        default:
          break;
      }
    }
  });
};
