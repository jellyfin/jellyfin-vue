import destr from 'destr';
import { defineStore } from 'pinia';

let intervalId: number | null = null;

export interface WebSocketMessage {
  MessageType: string;
  Data?: Record<string, never>;
}

/**
 * Clears the WebSocket reconnection interval
 */
function clearInterval(): void {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

type WebSocketMessageData = Record<string, never> | number | undefined;

export interface SocketState {
  instance: WebSocket | null;
  isConnected: boolean;
  messageType: string;
  messageData?: WebSocketMessageData;
  isConnecting: boolean;
}

export const socketStore = defineStore('socket', {
  state: () => {
    return {
      instance: null,
      isConnected: false,
      messageType: '',
      messageData: undefined,
      isConnecting: false
    } as SocketState;
  },
  actions: {
    /**
     * Connect the WebSocket to the Jellyfin server
     *
     * @param url
     * @param reconnect
     */
    connect(url: string, reconnect?: boolean): void {
      const isDifferentWebsocket = this.instance && url !== this.instance.url;

      if (!this.instance || isDifferentWebsocket) {
        if (isDifferentWebsocket) {
          this.closeSocket();
        }

        if (reconnect === undefined) {
          reconnect = true;
        }

        console.info(`[WebSocket] Connecting to ${url}...`);
        this.isConnecting = true;

        const instance = new WebSocket(url);

        this.instance = instance;
        this.isConnecting = false;
        this.isConnected = true;

        instance.onopen = (_event: Event): void => {
          const url = instance.url;

          console.info(`[WebSocket] Connection established to ${url}!`);
          clearInterval();

          instance.onerror = (_event: Event): void => {
            const url = instance.url;

            console.error(`[WebSocket] Error in the connection with ${url}`);
            this.closeSocket();

            if (reconnect) {
              console.log(
                '[WebSocket] Reconnecting the socket in 3 seconds...'
              );
              intervalId = window.setInterval(() => {
                this.connect(url, true);
              }, 3000);
            }
          };
        };

        instance.onmessage = (event: MessageEvent): void => {
          if (event.data) {
            const message = destr(event.data) as WebSocketMessage;

            if (message.MessageType !== undefined) {
              this.setMessage(message.MessageType, message.Data);
            }
          }
        };
      }
    },
    setMessage(messageType: string, messageData: WebSocketMessageData) {
      this.messageType = messageType;
      this.messageData = messageData;
    },
    sendToSocket(message: string): void {
      if (this.instance) {
        this.instance.send(JSON.stringify(message));
      }
    },
    closeSocket(): void {
      if (this.instance) {
        const url = this.instance?.url;

        console.log(`[WebSocket] Closing connection to ${url}...`);
        clearInterval();
        this.instance.close();
        this.instance = null;
        this.isConnected = false;
        this.$reset();
      }
    }
  }
});
