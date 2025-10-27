export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequestParams {
  messages: ChatMessage[];
  model?: string;
}

import type { ServiceDefinition } from '../http/types';

export type ChatServiceName = 'chat_glm' | 'chat_ty';
export interface ChatServiceDefinition
  extends ServiceDefinition<ChatRequestParams, ChatMessage | undefined> {
  name: ChatServiceName;
}
