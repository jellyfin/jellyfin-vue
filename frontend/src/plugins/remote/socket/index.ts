import { useWebSocket } from '@vueuse/core';
import { destr } from 'destr';
import { computed, watch } from 'vue';
import auth from '../auth';
import sdk from '../sdk';
import type { WebSocketMessage } from './types';
import { isNil } from '@/utils/validation';

class RemotePluginSocket {
  private _internalMessage: WebSocketMessage | undefined = undefined;
  private readonly _socketUrl = computed(() => {
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
  private readonly _keepAliveMessage = 'KeepAlive';
  /**
   * Formats the message to be sent to the socket
   */
  private readonly _formatSocketMessage = (
    name: string,
    data?: WebSocketMessage['Data']
  ): string => {
    const message: WebSocketMessage = { MessageType: name };

    if (!isNil(data)) {
      message.Data = data;
    }

    return JSON.stringify(message);
  };
  private readonly _webSocket = useWebSocket(this._socketUrl, {
    heartbeat: false,
    autoReconnect: { retries: () => true },
    immediate: true,
    autoClose: false
  });

  public get isConnected(): boolean {
    return this._webSocket.status.value === 'OPEN';
  }

  public get message(): WebSocketMessage | undefined {
    return this._internalMessage;
  }

  /**
   * Send message to socket
   * @param name - Name of the message type to be sent
   * @param data - Payload to send
   */
  public readonly sendToSocket = (
    ...arguments_: Parameters<typeof this._formatSocketMessage>
  ): void => {
    this._webSocket.send(this._formatSocketMessage(...arguments_));
  };

  public constructor() {
    /**
     * Sending updates through this watcher to avoid sending KeepAlive messages to consumers of
     * of this plugin
     */
    watch(this._webSocket.data, () => {
      const message = destr<WebSocketMessage | undefined>(this._webSocket.data.value);

      if (message?.MessageType === 'ForceKeepAlive') {
        this.sendToSocket(this._keepAliveMessage);
      } else if (message?.MessageType !== this._keepAliveMessage) {
        this._internalMessage = message;
      }
    }, { flush: 'sync' }
    );
  }
}

const RemotePluginSocketInstance = new RemotePluginSocket();
export default RemotePluginSocketInstance;
