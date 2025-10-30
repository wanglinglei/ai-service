import { Injectable } from '@nestjs/common';
import { serviceController } from 'src/services';
import { ChatDto } from './DTO/chatDto';
@Injectable()
export class ChatService {
  async chat(body: ChatDto) {
    const { model = 'qwen-plus', messages, provider = 'ty' } = body;
    const response = await serviceController.executeService(
      'chat',
      `chat_${provider}`,
      {
        messages,
        model,
      },
    );
    return response;
  }
}
