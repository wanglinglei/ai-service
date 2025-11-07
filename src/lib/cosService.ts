import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

// COS SDK 使用 CommonJS 导出，使用 require 导入
// eslint-disable-next-line @typescript-eslint/no-require-imports
const COS = require('cos-nodejs-sdk-v5');

export interface UploadImageResult {
  bucket: string;
  key: string;
  location: string;
  etag: string;
  publicUrl: string;
}
// 加载环境变量
dotenv.config();
@Injectable()
export class CosService {
  private readonly logger = new Logger(CosService.name);
  private bucket = 'ship-any-1322020322';
  private prefix = 'imageGenerate/12/avatar';
  private cos: any; // COS 实例
  private cosRegion = 'ap-shanghai';
  private customDomain = 'https://static.jscoder.com';

  constructor() {
    // 根据腾讯云官方文档初始化 COS 实例
    this.cos = new COS({
      SecretId: process.env.COS_SECRET_ID!,
      SecretKey: process.env.COS_SECRET_KEY!,
      // 可选：设置其他配置项
      FileParallelLimit: 3, // 控制文件上传并发数
      ChunkParallelLimit: 8, // 控制单个文件下分块上传并发数，在同园区上传可以设置较大的并发数
      ChunkSize: 1024 * 1024 * 8, // 控制分块大小，单位 B，在同园区上传可以设置较大的分块大小
      Protocol: 'https:', // 明确指定协议
      Domain: '{Bucket}.cos.{Region}.myqcloud.com', // 使用默认域名格式
      ForceSignHost: false, // 关闭强制签名 host，可能解决兼容性问题
    });
  }

  /**
   * 生成文件key
   */
  generateFileKey(fileName?: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);

    if (fileName) {
      const ext = fileName.split('.').pop();
      return `${this.prefix}/${timestamp}-${randomStr}${ext ? '.' + ext : ''}`;
    }

    return `${this.prefix}/${timestamp}-${randomStr}`;
  }

  /**
   * 上传文件到腾讯云COS（从 multer file 对象）
   * @param file - multer 处理后的文件对象
   * @param prefix - 文件前缀，默认为 'uploads'
   * @return {Promise<UploadImageResult>}
   */
  async uploadFile(file: Express.Multer.File): Promise<UploadImageResult> {
    try {
      if (!file) {
        throw new Error('文件不能为空');
      }

      // 获取文件扩展名
      const ext = file.originalname.split('.').pop() || 'bin';
      const contentType = file.mimetype || this.getContentTypeByExt(ext);

      // 生成文件key
      const key = this.generateFileKey(file.originalname);

      this.logger.log(`准备上传文件到COS, key: ${key}, size: ${file.size}`);

      // 上传到COS
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const result = await this.cos.putObject({
        Bucket: this.bucket,
        Region: this.cosRegion,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 缓存一年
      });

      // 生成公开访问URL
      const publicUrl = `${this.customDomain}/${key}`;

      const uploadResult: UploadImageResult = {
        bucket: this.bucket,
        key: key,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        location: result.Location || '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        etag: result.ETag || '',
        publicUrl: publicUrl,
      };

      return uploadResult;
    } catch (error) {
      this.logger.error('上传文件失败:', error);
      throw new Error(
        `文件上传失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 根据文件扩展名获取 Content-Type
   */
  private getContentTypeByExt(ext: string): string {
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * 删除单个文件
   * @param {string} key - 文件的完整路径
   */
  async deleteFile(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.cos.deleteObject(
        {
          Bucket: this.bucket,
          Region: process.env.COS_REGION!,
          Key: key,
        },
        function (error: any) {
          if (error) {
            console.error('删除文件失败:', error);
            reject(error instanceof Error ? error : new Error(String(error)));
          } else {
            console.log('文件删除成功:', key);
            resolve();
          }
        },
      );
    });
  }

  /**
   * 检查存储桶是否存在
   */
  async checkBucketExists(): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      await this.cos.headBucket({
        Bucket: this.bucket,
        Region: process.env.COS_REGION!,
      });
      return true;
    } catch {
      return false;
    }
  }
}
