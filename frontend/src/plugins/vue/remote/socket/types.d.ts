export interface WebSocketMessage {
  MessageType: string;
  Data?: Record<string, never>;
}

export type WebSocketMessageData = Record<string, never> | number | undefined;
