export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatDto {
  model?: string;
  messages: ChatMessage[];
  provider?: string;
}
