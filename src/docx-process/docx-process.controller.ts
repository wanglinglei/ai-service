import {
  Controller,
  Post,
  Get,
  UploadedFiles,
  UseInterceptors,
  Body,
  HttpCode,
} from '@nestjs/common';
import {
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
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

  @Post('/process')
  @HttpCode(200)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'rawDocument',
          maxCount: 1,
        },
        { name: 'template', maxCount: 1 },
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
          return cb(null, true);
          // if (file.originalname.toLowerCase().endsWith('.docx')) {
          //   cb(null, true);
          // } else {
          //   cb(new Error('仅支持 .docx 文件'), false);
          // }
        },
      },
    ),
  )
  process(
    @UploadedFiles()
    files: {
      rawDocument: Express.Multer.File[];
      template: Express.Multer.File[];
    },
  ): Promise<string> {
    const { rawDocument = [], template = [] } = files;
    if (!rawDocument || !template) {
      throw new Error('请上传两个文件：rawDocument 和 template');
    }
    console.log('rawDocument[0]', rawDocument[0]);
    console.log('template[0]', template[0]);
    return this.docxProcessService.process(rawDocument[0], template[0]);
  }
}
