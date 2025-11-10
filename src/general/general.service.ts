import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';
import { Request as ExpressRequest } from 'express';
import { CosService, UploadImageResult } from '../lib/cosService';
import { VerificationService } from '../lib/verificationService';
import * as nodemailer from 'nodemailer';

@Injectable()
export class GeneralService {
  private readonly logger = new Logger(GeneralService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly cosService: CosService,
    private readonly verificationService: VerificationService,
  ) {
    // 初始化邮件传输器（使用网易邮箱）
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.163.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: true, // 使用 SSL
      auth: {
        user: process.env.EMAIL_USER, // 发送邮件的邮箱地址
        pass: process.env.EMAIL_PASS, // 邮箱授权码（不是登录密码）
      },
    });
  }

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
          reject(new Error(`Session save failed: ${err.message || err}`));
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
   * 发送邮箱验证码
   * @param session - Express session 对象
   * @param email - 接收验证码的邮箱地址
   * @returns 发送结果
   */
  async sendEmailCode(
    session: ExpressRequest['session'],
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    if (!session) {
      throw new BadRequestException('Session 不可用');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new BadRequestException('邮箱格式不正确');
    }

    // 检查邮箱配置
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      this.logger.error(
        '邮箱配置缺失，请设置 EMAIL_USER 和 EMAIL_PASS 环境变量',
      );
      throw new BadRequestException('邮箱服务未配置');
    }

    // 检查发送频率限制（防止频繁发送）
    const lastSendTime = (session as any).emailCodeLastSendTime;
    const now = Date.now();
    if (lastSendTime && now - lastSendTime < 60000) {
      // 60秒内只能发送一次
      throw new BadRequestException('发送过于频繁，请稍后再试');
    }

    // 生成6位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 将验证码存储到 session
    (session as any).emailCode = code;
    (session as any).emailCodeEmail = email;
    (session as any).emailCodeLastSendTime = now;
    (session as any).emailCodeExpireTime = now + 10 * 60 * 1000; // 10分钟过期

    // 邮件内容
    const mailOptions = {
      from: `"magicAI" <${process.env.EMAIL_USER}>`, // 发送者
      to: email, // 接收者
      subject: '邮箱验证码', // 主题
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;font-size:20px;">邮箱验证码</h2>
          <p style="color: #666; font-size: 16px;">您好，</p>
          <p style="color: #666; font-size: 16px;">您的验证码是：</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <span style="font-size: 32px; font-weight: bold; color: #1890ff; letter-spacing: 5px;">${code}</span>
          </div>
          <p style="color: #999; font-size: 14px;">验证码有效期为 10 分钟，请勿泄露给他人。</p>
          <p style="color: #999; font-size: 14px;">验证码由系统自动生成，请勿回复此邮件。</p>
          <p style="color: #999; font-size: 14px;">如非本人操作，请忽略此邮件。</p>
        </div>
      `,
    };

    try {
      // 发送邮件
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`邮箱验证码已发送到: ${email}`);

      // 保存 session
      return new Promise((resolve, reject) => {
        session.save((err) => {
          if (err) {
            this.logger.error('Session save error:', err);
            reject(new BadRequestException('发送失败，请稍后重试'));
          } else {
            resolve({
              success: true,
              message: '验证码已发送到您的邮箱',
            });
          }
        });
      });
    } catch (error) {
      this.logger.error('发送邮件失败:', error);
      // 清除 session 中的验证码信息
      delete (session as any).emailCode;
      delete (session as any).emailCodeEmail;
      delete (session as any).emailCodeLastSendTime;
      delete (session as any).emailCodeExpireTime;

      const errorMessage =
        error instanceof Error
          ? `发送失败: ${error.message}`
          : '发送失败，请稍后重试';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * 验证邮箱验证码
   * @param session - Express session 对象
   * @param email - 邮箱地址
   * @param code - 验证码
   * @returns 验证结果
   */
  verifyEmailCode(
    session: ExpressRequest['session'],
    email: string,
    code: string,
  ): boolean {
    return this.verificationService.verifyEmailCode(session, email, code);
  }

  /**
   * 验证验证码
   */
  verifyCaptcha(session: ExpressRequest['session'], code: string): boolean {
    return this.verificationService.verifyCaptcha(session, code);
  }

  /**
   * 上传文件到腾讯云COS
   * @param file - multer 处理后的文件对象
   * @param prefix - 文件前缀，默认为 'general'
   * @returns 上传结果，包含图片链接
   */
  async upload(
    file: Express.Multer.File,
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
