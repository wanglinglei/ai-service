import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';

import { AlipaySdk } from 'alipay-sdk';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

interface AlipayUserInfoResponse {
  nickName?: string;
  avatar?: string;
  gender?: string;
  code?: string;
  msg?: string;
  province?: string;
  city?: string;
}

interface AuthCallbackResult {
  accessToken: string;
  userInfo: {
    id: number;
    username: string;
    nickname: string;
    email?: string;
    avatar?: string;
    province?: string;
    city?: string;
  };
}

@Injectable()
export class AlipayAuthService {
  private readonly appId: string = '2021006105634443';
  private readonly appPrivateKey: string;
  private readonly alipayPublicKey: string;
  private readonly alipaySdk: AlipaySdk;
  private readonly logger = new Logger(AlipayAuthService.name);
  constructor(private userService: UserService) {
    this.appPrivateKey = process.env.APP_PRIVATE_KEY || '';
    this.alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY || '';
    this.alipaySdk = new AlipaySdk({
      appId: this.appId,
      privateKey: this.appPrivateKey,
      alipayPublicKey: this.alipayPublicKey,
    });
  }

  /**
   * 通过authCode登录，获取用户信息和token（前端调用）
   */
  async loginByAuthCode(authCode: string): Promise<AuthCallbackResult> {
    try {
      if (!authCode) {
        throw new BadRequestException('缺少授权码');
      }

      // 使用auth_code换取access_token
      const tokenResult = await this.alipaySdk.exec(
        'alipay.system.oauth.token',
        {
          grant_type: 'authorization_code',
          code: authCode,
        },
      );

      this.logger.log(`tokenResult: ${JSON.stringify(tokenResult)}`);

      const { accessToken, openId } = tokenResult;
      // const accessToken = 'authusrBb3720fcbe563483b9ec218202d7afX62';
      // const openId = '20887123456789012345';

      // 获取用户信息
      const alipayUserInfo = await this.getUserInfo(accessToken);

      // 查找或创建用户
      let user = await this.userService.findBySourceUserId(openId);
      this.logger.log(`user: ${JSON.stringify(user)}`);
      const { nickName, avatar, gender, province, city } = alipayUserInfo;

      if (!user) {
        // 创建新用户
        const nickname = nickName || `支付宝用户`;

        user = await this.userService.createAlipayUser({
          username: '',
          nickname,
          alipayUserId: openId,
          avatar,
          gender:
            gender === 'm' ? 'male' : gender === 'f' ? 'female' : 'unknown',
          province,
          city,
        });
      } else {
        // 更新用户信息
        if (alipayUserInfo.nickName) {
          user.nickname = alipayUserInfo.nickName;
        }
        if (alipayUserInfo.avatar) {
          user.avatar = alipayUserInfo.avatar;
        }
        await this.userService.updateUser(user);
      }

      // 生成JWT token
      const jwtToken = this.userService.generateToken(user);

      return {
        accessToken: jwtToken,
        userInfo: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          province: user.province,
          city: user.city,
        },
      };
    } catch (error) {
      this.logger.error(`loginByAuthCode error: ${error}`);
      throw new BadRequestException('登录失败');
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(accessToken: string): Promise<AlipayUserInfoResponse> {
    const bizContent = {
      auth_token: accessToken,
    };
    // authusrBb3720fcbe563483b9ec218202d7afX62
    const userInfo = await this.alipaySdk.exec(
      'alipay.user.info.share',
      bizContent,
    );
    this.logger.log(`userInfo: ${JSON.stringify(userInfo)}`);

    if (!userInfo) {
      throw new Error('获取用户信息失败：响应格式错误');
    }

    return userInfo;
  }
}
