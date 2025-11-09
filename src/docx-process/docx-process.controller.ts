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
import { diskStorage, StorageEngine } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { DocxProcessService } from './docx-process.service';

/**
 * 自定义 storage，在文件保存后设置权限
 */
function createStorageWithPermissions(): StorageEngine {
  const storage = diskStorage({
    destination: (req, file, callback) => {
      // 使用绝对路径
      const uploadsDir = join(process.cwd(), 'uploads');
      callback(null, uploadsDir);
    },
    filename: (req, file: Express.Multer.File, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  });

  // 包装 _handleFile 方法以在保存后设置权限
  const originalHandleFile = storage._handleFile.bind(storage);
  storage._handleFile = (req, file, cb) => {
    originalHandleFile(req, file, (error, info) => {
      if (error) {
        return cb(error);
      }

      // 文件保存成功后，尝试设置权限
      if (
        info &&
        typeof info === 'object' &&
        'path' in info &&
        typeof (info as { path?: unknown }).path === 'string'
      ) {
        const filePath = (info as { path: string }).path;
        // 异步设置权限，但不阻塞回调
        fs.promises
          .chmod(filePath, 0o644)
          .then(() => {
            // 权限设置成功，静默处理
          })
          .catch((chmodError) => {
            // 如果设置权限失败（例如卷挂载时），只记录警告，不阻止文件使用
            console.warn(`⚠️ 无法设置文件权限: ${filePath}`, chmodError);
          });
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      cb(null, info);
    });
  };

  return storage;
}

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
        storage: createStorageWithPermissions(),
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
