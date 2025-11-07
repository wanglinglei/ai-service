import {
  Controller,
  Get,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { GeneralService } from './general.service';
import { Request as ExpressRequest } from 'express';

@Controller('general')
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  @Get('/health')
  health(): string {
    return 'ok';
  }

  @Get('/captcha')
  async getCaptcha(@Request() req: ExpressRequest) {
    const { data } = await this.generalService.getCaptcha(req.session);
    return {
      image: `data:image/svg+xml;base64,${Buffer.from(data).toString('base64')}`,
    };
  }

  @Post('/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // 使用内存存储，文件会保存在 file.buffer 中
      limits: {
        fileSize: 10 * 1024 * 1024, // 限制文件大小为 10MB
      },
      fileFilter: (req, file, cb) => {
        // 验证文件类型
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(`不支持的文件类型: ${file.mimetype}，仅支持图片格式`),
            false,
          );
        }
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    return this.generalService.upload(file);
  }
}
