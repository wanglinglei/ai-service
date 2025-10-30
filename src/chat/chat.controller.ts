import { Controller, Get, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto } from './DTO/chatDto';
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('/health')
  health(): string {
    return 'ok';
  }

  @Post('/chat')
  chat(@Body() body: ChatDto) {
    return this.chatService.chat(body);
  }
}
