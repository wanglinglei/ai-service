import { Controller, Get, Query, Res, Post, Body } from '@nestjs/common';
import { Response } from 'express';
import { AlipayAuthService } from './alipay-auth.service';

@Controller('alipay-auth')
export class AlipayAuthController {
  constructor(private readonly alipayAuthService: AlipayAuthService) {}

  /**
   * 通过authCode获取用户信息和token（前端调用）
   */
  @Post('login')
  async loginByAuthCode(@Body('authCode') authCode: string) {
    return this.alipayAuthService.loginByAuthCode(authCode);
  }

  /**
   * @description: 获取用户信息 调试调用
   * @return {*}
   */
  @Post('getUserInfo')
  async getUserInfo(@Body('accessToken') accessToken: string) {
    return this.alipayAuthService.getUserInfo(accessToken);
  }
}
