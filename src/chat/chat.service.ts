import { Injectable } from '@nestjs/common';
import { serviceController } from 'src/services';
import { ChatDto } from './DTO/chatDto';
@Injectable()
export class ChatService {
  async chat(body: ChatDto) {
    const { model, messages, provider = 'chat_ty' } = body;
    const response = await serviceController.executeService('chat', provider, {
      messages,
      model,
    });
    return response;
  }
}
