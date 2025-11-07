import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';
import { Request as ExpressRequest } from 'express';
import { CosService, UploadImageResult } from '../lib/cosService';

@Injectable()
export class GeneralService {
  private readonly logger = new Logger(GeneralService.name);

  constructor(private readonly cosService: CosService) {}

  /**
   * 生成图形验证码
   */
  async getCaptcha(
    session: ExpressRequest['session'],
  ): Promise<{ data: string }> {
    if (!session) {
      throw new Error('Session is not available');
    }

    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: '0o1il', // 忽略容易混淆的字符
      noise: 3, // 干扰线条数
      color: true, // 彩色
      background: '#f0f0f0', // 背景色
      width: 120,
      height: 40,
      fontSize: 50,
      charPreset: '123456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ', // 字符集
    });

    // 将验证码存储到 session（转换为小写以便验证时不区分大小写）
    (session as any).captcha = captcha.text.toLowerCase();

    // 记录 session ID 和验证码，用于调试
    this.logger.log(
      `Captcha generated: ${(session as any).captcha}, sessionID: ${(session as any).id || 'unknown'}`,
    );

    // 确保 session 被标记为已修改，以便保存
    // 使用 Promise 确保 session 保存完成后再返回
    return new Promise((resolve, reject) => {
      session.save((err) => {
        if (err) {
          this.logger.error('Session save error:', err);
          reject(err);
        } else {
          this.logger.log('Session saved successfully');
          resolve({
            data: captcha.data, // SVG 字符串
          });
        }
      });
    });
  }

  /**
   * 验证验证码
   */
  verifyCaptcha(session: ExpressRequest['session'], code: string): boolean {
    if (!session) {
      this.logger.warn('Session is not available');
      return false;
    }

    const sessionCaptcha = (session as any).captcha;
    const sessionId = (session as any).id || 'unknown';
    this.logger.log(
      `verifyCaptcha: code=${code}, session.captcha=${sessionCaptcha}, sessionID=${sessionId}`,
    );
    if (!code || !sessionCaptcha) {
      this.logger.warn(
        `Captcha verification failed: code=${code}, session.captcha=${sessionCaptcha}, sessionID=${sessionId}`,
      );
      return false;
    }

    // 验证码验证（不区分大小写）
    const isValid = sessionCaptcha === code.toLowerCase();

    // 验证后删除验证码（一次性使用）
    delete (session as any).captcha;

    // 确保 session 被标记为已修改
    session.save((err) => {
      if (err) {
        this.logger.error('Session save error after verification:', err);
      }
    });

    return isValid;
  }

  /**
   * 上传文件到腾讯云COS
   * @param file - multer 处理后的文件对象
   * @param prefix - 文件前缀，默认为 'general'
   * @returns 上传结果，包含图片链接
   */
  async upload(
    file: Express.Multer.File,
    prefix: string = 'general',
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('文件不能为空');
    }

    // 验证文件类型（仅允许图片）
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `不支持的文件类型: ${file.mimetype}，仅支持图片格式`,
      );
    }

    // 验证文件大小（限制为 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('文件大小不能超过 10MB');
    }

    try {
      const result: UploadImageResult = await this.cosService.uploadFile(file);

      return {
        url: result.publicUrl,
        key: result.key,
      };
    } catch (error) {
      this.logger.error('文件上传失败:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : '文件上传失败',
      );
    }
  }
}
