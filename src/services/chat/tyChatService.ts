import { baseFetch } from '../http/baseFetch';
import { TyBaseService } from '../baseServices/tyBaseService';
import type {
  ChatServiceDefinition,
  ChatRequestParams,
  ChatMessage,
  ChatServiceName,
} from './types';

export class TyChatService extends TyBaseService implements ChatServiceDefinition {
  name: ChatServiceName = 'chat_ty';

  async execute(params: ChatRequestParams) {
    const { messages, model = 'qwen-plus' } = params;
    const response = await baseFetch({
      method: 'POST',
      url: this.buildApiUrl('/compatible-mode/v1/chat/completions'),
      headers: this.getCommonHeaders(),
      body: {
        messages,
        model,
      },
    });
    if (response?.choices?.[0]?.message) {
      return response.choices[0].message;
    }
  }
}
