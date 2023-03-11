export interface WebSocketMessage {
  MessageType: string;
  Data?: Record<string, unknown>;
}

export type WebSocketMessageData = Record<string, unknown> | number | undefined;
