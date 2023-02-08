import { useWebSocket } from '@vueuse/core';
import destr from 'destr';
import { isNil } from 'lodash-es';
import { computed, watch } from 'vue';
import auth from '../auth';
import sdk from '../sdk';
import { WebSocketMessage } from './types';
import { RunningTask, TaskType } from '@/store/taskManager';
import { itemsStore, taskManagerStore } from '@/store';

/**
 * Formats the message to be sent to the socket
 */
function formatSocketMessage(
  name: string,
  data?: Record<string, never>
): string {
  const message: WebSocketMessage = { MessageType: name };

  if (!isNil(data)) {
    message.Data = data;
  }

  return JSON.stringify(message);
}

const socketUrl = computed(() => {
  if (
    auth.currentUserToken &&
    auth.currentServer &&
    sdk.deviceInfo.id &&
    sdk.api?.basePath
  ) {
    const socketParameters = new URLSearchParams({
      api_key: auth.currentUserToken,
      deviceId: sdk.deviceInfo.id
    }).toString();

    return `${sdk.api.basePath}/socket?${socketParameters}`
      .replace('https:', 'wss:')
      .replace('http:', 'ws:');
  }
});

const { data, send } = useWebSocket(socketUrl, {
  heartbeat: { message: formatSocketMessage('KeepAlive') },
  autoReconnect: { retries: () => true },
  immediate: true,
  autoClose: false
});

class RemotePluginSocket {
  public message = computed<WebSocketMessage | undefined>(() => {
    const m = destr(data) as WebSocketMessage;

    return typeof m.MessageType === 'string' ? m : undefined;
  });
  public messageType = computed<WebSocketMessage['MessageType'] | undefined>(
    () => this.message.value?.MessageType
  );
  public messageData = computed<WebSocketMessage['Data'] | undefined>(
    () => this.message.value?.Data
  );

  /**
   * Send message to socket
   * @param name - Name of the message type to be sent
   * @param data - Payload to send
   */
  public sendToSocket(
    ...arguments_: Parameters<typeof formatSocketMessage>
  ): void {
    send(formatSocketMessage(...arguments_));
  }

  public constructor() {
    watch(this.message, () => {
      const items = itemsStore();
      const taskManager = taskManagerStore();
      let itemsToUpdate: string[];

      switch (this.messageType.value) {
        case 'ForceKeepAlive': {
          /**
           * Although we poll the WebSocket through useWebSocket, the server
           * might force us to do a KeepAlive.
           */
          this.sendToSocket('KeepAlive');
          break;
        }
        case 'LibraryChanged': {
          // Update items when metadata changes
          // @ts-expect-error -- The Data property doesn't describe its content
          itemsToUpdate = messageData.ItemsUpdated.filter((itemId: string) => {
            return Object.keys(items.byId).includes(itemId);
          });

          items.updateStoreItems(itemsToUpdate);
          break;
        }
        case 'UserDataChanged': {
          // Update items when their userdata is changed (like, mark as watched, etc)
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

          items.updateStoreItems(itemsToUpdate);
          break;
        }
        case 'RefreshProgress': {
          // TODO: Verify all the different tasks that this message may belong to - here we assume libraries.

          // @ts-expect-error - No typings for this
          const progress = Number.parseInt(messageData.Progress);
          // @ts-expect-error - No typings for this
          const taskPayload = taskManager.getTask(messageData.ItemId || '');
          const payload: RunningTask = {
            type: TaskType.LibraryRefresh,
            // @ts-expect-error - No typings for this
            id: messageData.ItemId as string,
            progress
          };

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
        }
        default: {
          break;
        }
      }
    });
  }
}

const RemotePluginSocketInstance = new RemotePluginSocket();
export default RemotePluginSocketInstance;
