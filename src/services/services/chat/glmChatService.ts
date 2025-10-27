import { baseFetch } from '../http/baseFetch';
import { GlmBaseService } from '../baseServices/glmBaseService';
import type {
  ChatServiceDefinition,
  ChatRequestParams,
  ChatServiceName,
  ChatMessage,
} from './types';

export class GlmChatService extends GlmBaseService implements ChatServiceDefinition {
  name: ChatServiceName = 'chat_glm';

  async execute(params: ChatRequestParams): Promise<ChatMessage | undefined> {
    const { messages, model = 'glm-4.5' } = params;
    const response = await baseFetch({
      method: 'POST',
      url: this.buildApiUrl('/api/paas/v4/chat/completions'),
      headers: this.getCommonHeaders(),
      body: {
        messages,
        model,
      },
    });
    console.log('glm response', response);
    if (response?.choices?.[0]?.message) {
      return response.choices[0].message;
    }
  }
}
