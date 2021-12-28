import destr from 'destr';
import { ActionTree, MutationTree } from 'vuex';

let intervalId: number | null = null;

export interface WebSocketMessage {
  MessageType: string;
  Data?: Record<string, never>;
}

export interface SocketState {
  instance: WebSocket | null;
  isConnected: boolean;
  messageType: string;
  messageData?: Record<string, never> | number;
  isConnecting: boolean;
}

export const defaultState = (): SocketState => ({
  instance: null,
  isConnected: false,
  messageType: '',
  messageData: undefined,
  isConnecting: false
});

export const state = defaultState;

/**
 * Clears the WebSocket reconnection interval
 */
function clearInterval(): void {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

export const mutations: MutationTree<SocketState> = {
  ONOPEN(state: SocketState, { instance }: { instance: WebSocket }) {
    state.instance = instance;
    state.isConnecting = false;
    state.isConnected = true;
  },
  ONCLOSE(state: SocketState) {
    if (state.instance) {
      state.instance.close();
      state.instance = null;
    }

    state.isConnected = false;
  },
  ONMESSAGE(state: SocketState, { message }: { message: WebSocketMessage }) {
    state.messageType = message.MessageType;
    state.messageData = message.Data;
  },
  CONNECTING(state: SocketState) {
    state.isConnecting = true;
  }
};

export const actions: ActionTree<SocketState, SocketState> = {
  connectSocket(
    { commit, state, dispatch },
    { url, reconnect }: { url: string; reconnect?: boolean }
  ) {
    const isDifferentWebsocket = state.instance && url !== state.instance.url;

    if (!state.instance || isDifferentWebsocket) {
      if (isDifferentWebsocket) {
        dispatch('closeSocket');
      }

      if (reconnect === undefined) {
        reconnect = true;
      }

      console.info(`[WebSocket] Connecting to ${url}...`);
      commit('CONNECTING');

      const instance = new WebSocket(url);

      commit('ONOPEN', {
        instance
      });

      instance.onopen = (_event: Event): void => {
        const url = instance.url;

        console.info(`[WebSocket] Connection established to ${url}!`);
        clearInterval();

        instance.onerror = (_event: Event): void => {
          const url = instance.url;

          console.error(`[WebSocket] Error in the connection with ${url}`);
          dispatch('closeSocket');

          if (reconnect) {
            console.log('[WebSocket] Reconnecting the socket in 3 seconds...');
            intervalId = window.setInterval(() => {
              dispatch('connectSocket', { url, reconnect: true });
            }, 3000);
          }
        };
      };

      instance.onmessage = (event: MessageEvent): void => {
        if (event.data) {
          const message = destr(event.data) as WebSocketMessage;

          if (message.MessageType !== undefined) {
            commit('ONMESSAGE', { message });
          }
        }
      };
    }
  },
  sendToSocket({ state }, { message }: { message: WebSocketMessage }) {
    if (state.instance) {
      state.instance.send(JSON.stringify(message));
    }
  },
  closeSocket({ commit, state }) {
    if (state.instance) {
      const url = state.instance?.url;

      console.log(`[WebSocket] Closing connection to ${url}...`);
      clearInterval();
      commit('ONCLOSE');
    }
  }
};
