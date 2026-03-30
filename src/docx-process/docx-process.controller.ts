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

  @Post('/processDataByUpload')
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
  async processDataByUpload(
    @UploadedFiles()
    files: {
      rawDocument: Express.Multer.File[];
    },
    @Body() body: { templateJson?: string },
  ): Promise<any> {
    const { rawDocument = [] } = files || { rawDocument: [] };
    const { templateJson = '' } = body;
    if (!rawDocument.length) {
      throw new Error('请上传内容文件：rawDocument');
    }
    // if (!templateJson) {
    //   throw new Error('请上传模板数据：templateJson');
    // }
    const file = rawDocument[0];
    try {
      return await this.docxProcessService.processDataByUpload(
        file,
        templateJson,
      );
    } finally {
      // 处理完成后显式清理 buffer，帮助垃圾回收器更快释放内存
      // 使用类型断言来允许设置为 null
      if (file?.buffer) {
        // 清除 buffer 引用，帮助内存回收
        // 注意：在 Node.js 中，当没有引用指向 Buffer 时，垃圾回收器会自动回收
        // 这里通过删除属性来帮助更快释放内存
        delete (file as any).buffer;
      }
    }
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
  async processData(
    @UploadedFiles()
    files: {
      rawDocument: Express.Multer.File[];
    },
    @Body() body: { templateJson?: string },
  ): Promise<any> {
    const { rawDocument = [] } = files || { rawDocument: [] };
    const { templateJson = '' } = body;
    if (!rawDocument.length) {
      throw new Error('请上传内容文件：rawDocument');
    }
    if (!templateJson) {
      throw new Error('请上传模板数据：templateJson');
    }

    const file = rawDocument[0];
    try {
      // 处理文件
      return await this.docxProcessService.processData(file, templateJson);
    } finally {
      // 处理完成后显式清理 buffer，帮助垃圾回收器更快释放内存
      // 使用类型断言来允许设置为 null
      if (file?.buffer) {
        // 清除 buffer 引用，帮助内存回收
        // 注意：在 Node.js 中，当没有引用指向 Buffer 时，垃圾回收器会自动回收
        // 这里通过删除属性来帮助更快释放内存
        delete (file as any).buffer;
      }
    }
  }
}
