import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocxProcessModule } from './docx-process/docx-process.module';

@Module({
  imports: [DocxProcessModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
