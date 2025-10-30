import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocxProcessModule } from './docx-process/docx-process.module';
import { ChatModule } from './chat/chat.module';
import { VideoModule } from './video/video.module';
import { ImageModule } from './image/image.module';

@Module({
  imports: [DocxProcessModule, ChatModule, VideoModule, ImageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
