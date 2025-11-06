import { Injectable, BadRequestException } from '@nestjs/common';
import { serviceController } from 'src/services';
import { ChatDto } from './DTO/chatDto';
@Injectable()
export class ChatService {
  async chat(body: ChatDto) {
    const { model = 'qwen-plus', messages, provider = 'ty' } = body;
    try {
      const data = await serviceController.executeService(
        'chat',
        `chat_${provider}`,
        {
          messages,
          model,
        },
      );
      return data;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : '聊天服务调用失败',
      );
    }
  }
}
