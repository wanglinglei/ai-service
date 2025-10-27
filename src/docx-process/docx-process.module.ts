import { Module } from '@nestjs/common';
import { DocxProcessController } from './docx-process.controller';
import { DocxProcessService } from './docx-process.service';

@Module({
  controllers: [DocxProcessController],
  providers: [DocxProcessService],
})
export class DocxProcessModule {}
