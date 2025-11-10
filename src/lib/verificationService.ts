import { Injectable, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

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
    if (!session) {
      this.logger.warn('Session is not available');
      return false;
    }

    const sessionCode = (session as any).emailCode;
    const sessionEmail = (session as any).emailCodeEmail;
    const expireTime = (session as any).emailCodeExpireTime;
    const now = Date.now();

    // 检查验证码是否存在
    if (!sessionCode || !sessionEmail) {
      this.logger.warn('验证码不存在');
      return false;
    }

    // 检查是否过期
    if (expireTime && now > expireTime) {
      this.logger.warn('验证码已过期');
      // 清除过期的验证码
      delete (session as any).emailCode;
      delete (session as any).emailCodeEmail;
      delete (session as any).emailCodeExpireTime;
      return false;
    }

    // 验证邮箱和验证码
    const isValid = sessionEmail === email && sessionCode === code.toString();

    if (isValid) {
      // 验证成功后删除验证码（一次性使用）
      delete (session as any).emailCode;
      delete (session as any).emailCodeEmail;
      delete (session as any).emailCodeLastSendTime;
      delete (session as any).emailCodeExpireTime;

      // 保存 session
      session.save((err) => {
        if (err) {
          this.logger.error('Session save error after verification:', err);
        }
      });
    }

    return isValid;
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
}
