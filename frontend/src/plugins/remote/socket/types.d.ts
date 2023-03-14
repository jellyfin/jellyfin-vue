export interface WebSocketMessage {
  MessageType: string;
  Data?: Record<string, unknown> | number;
}
