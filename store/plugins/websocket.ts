import { Plugin } from 'vuex';
import { AppState } from '..';

interface WebSocketMessage {
  MessageType: string;
  Data?: Record<string, never>;
}

export const websocketPlugin: Plugin<AppState> = (store) => {
  let keepAliveInterval: number;

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

    store.state.socket.instance?.send(JSON.stringify(msg));
  }

  store.subscribe((mutation, state) => {
    if (
      mutation.type === 'SOCKET_ONMESSAGE' &&
      state.socket.message.MessageType === 'ForceKeepAlive'
    ) {
      sendWebsocketMessage('KeepAlive');
      keepAliveInterval = window.setInterval(() => {
        sendWebsocketMessage('KeepAlive');
      }, state.socket.message.Data * 1000 * 0.5);
    } else if (mutation.type === 'SOCKET_ONCLOSE') {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    }
  });
};
