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
import { diskStorage } from 'multer';
import { extname } from 'path';
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
        dest: 'uploads/',
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file: Express.Multer.File, callback) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const filename = `${uniqueSuffix}${ext}`;
            callback(null, filename);
          },
        }),
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
