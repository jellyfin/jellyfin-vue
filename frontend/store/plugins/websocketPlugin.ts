import { BaseItemDto } from '@jellyfin/client-axios';
import { Plugin } from 'vuex';
import { AppState } from '..';
import { WebSocketMessage } from '../socket';

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

  store.subscribe((mutation, state) => {
    const messageType = state.socket.messageType;
    const messageData = state.socket.messageData;
    const storeIds = store.state.items.allIds;
    let itemsToUpdate: string[];

    if (mutation.type === 'socket/ONMESSAGE') {
      switch (messageType) {
        case 'ForceKeepAlive': // Keep the websocket alive
          sendWebsocketMessage('KeepAlive');
          break;
        case 'LibraryChanged': // Update items when metadata changes
          // @ts-expect-error -- The Data property doesn't describe its content
          itemsToUpdate = messageData.ItemsUpdated.filter((itemId: string) => {
            return storeIds.includes(itemId);
          });

          updateStoreItems(itemsToUpdate);
          break;
        case 'UserDataChanged': // Update items when their userdata is changed (like, mark as watched, etc)
          // @ts-expect-error -- The Data property doesn't describe its content
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
        default:
          break;
      }
    }
  });
};
