import {
  Controller,
  Post,
  Get,
  UploadedFiles,
  UseInterceptors,
  Body,
  HttpCode,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocxProcessService } from './docx-process.service';

@Controller('docx-process')
export class DocxProcessController {
  constructor(private readonly docxProcessService: DocxProcessService) {}

  @Get('/health')
  health(): string {
    return 'ok';
  }

  @Post('/processData')
  @HttpCode(200)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'rawDocument',
          maxCount: 1,
        },
      ],
      {
        storage: memoryStorage(), // 使用内存存储，避免文件系统权限问题
        limits: {
          fileSize: 10 * 1024 * 1024, // 限制文件大小为 10MB
        },
        fileFilter: (req, file: Express.Multer.File, cb) => {
          if (file.originalname.toLowerCase().endsWith('.docx')) {
            cb(null, true);
          } else {
            cb(new Error('仅支持 .docx 文件'), false);
          }
        },
      },
    ),
  )
  processData(
    @UploadedFiles()
    files: {
      rawDocument: Express.Multer.File[];
    },
    @Body() body: { templateJson?: string },
  ): Promise<string> {
    const { rawDocument = [] } = files;
    const { templateJson } = body;
    if (!rawDocument) {
      throw new Error('请上传内容文件：rawDocument');
    }
    if (!templateJson) {
      throw new Error('请上传模板数据：templateJson');
    }
    return this.docxProcessService.processData(rawDocument[0], templateJson);
  }
}
