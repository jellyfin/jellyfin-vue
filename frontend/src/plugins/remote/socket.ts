import { useWebSocket } from '@vueuse/core';
import { destr } from 'destr';
import { computed, watch } from 'vue';
import { isNil, sealed } from '@jellyfin-vue/shared/validation';
import auth from './auth';
import sdk from './sdk';

interface WebSocketMessage {
  MessageType: string;
  Data?: unknown;
}

@sealed
class RemotePluginSocket {
  /**
   * == STATE ==
   */
  private readonly _socketUrl = computed(() => {
    if (
      auth.currentUserToken.value
      && auth.currentServer.value
      && sdk.deviceInfo.id
      && sdk.api?.basePath
    ) {
      const socketParameters = new URLSearchParams({
        api_key: auth.currentUserToken.value,
        deviceId: sdk.deviceInfo.id
      }).toString();

      return `${sdk.api.basePath}/socket?${socketParameters}`
        .replace('https:', 'wss:')
        .replace('http:', 'ws:');
    }
  });

  private readonly _keepAliveMessage = 'KeepAlive';
  private readonly _forceKeepAliveMessage = 'ForceKeepAlive';
  private readonly _updateInterval = '0,1';
  /**
   * Formats the message to be sent to the socket
   */
  private readonly _webSocket = useWebSocket(this._socketUrl, {
    autoReconnect: true,
    onConnected: () => {
      this.sendToSocket('ScheduledTasksInfoStart', this._updateInterval);
      this.sendToSocket('ActivityLogEntryStart', this._updateInterval);
      this.sendToSocket('SessionsStart', this._updateInterval);
    }
  });

  private readonly _parsedmsg = computed<WebSocketMessage | undefined>(() => destr(this._webSocket.data.value));
  public readonly message = computed<WebSocketMessage | undefined>((previous) => {
    if (this._parsedmsg.value?.MessageType === this._keepAliveMessage
      || this._parsedmsg.value?.MessageType === this._forceKeepAliveMessage) {
      return previous;
    }

    return this._parsedmsg.value;
  });

  public readonly isConnected = computed(() => this._webSocket.status.value === 'OPEN');

  /**
   * == METHODS ==
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
    watch(this._parsedmsg, () => {
      if (this._parsedmsg.value?.MessageType === this._forceKeepAliveMessage) {
        this.sendToSocket(this._keepAliveMessage);
      }
    }, { flush: 'sync' });
  }
}

const RemotePluginSocketInstance = new RemotePluginSocket();
export default RemotePluginSocketInstance;
