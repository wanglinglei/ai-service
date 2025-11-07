import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user.service';
import { UserStatus } from '../entitys/user.entity';
import { Request } from 'express';
import { ErrorCode } from '../../common/config/error-code.config';

/**
 * 带错误码的未授权异常
 */
class UnauthorizedExceptionWithCode extends UnauthorizedException {
  constructor(message: string, public readonly errCode: ErrorCode) {
    super({ message, errCode });
  }
}

/**
 * 自定义 JWT 提取器，支持两种格式：
 * 1. Authorization: Bearer <token> (标准格式)
 * 2. Authorization: <token> (简化格式，兼容前端可能直接发送 token 的情况)
 */
const extractJwtFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  // 如果包含 Bearer 前缀，提取 token
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 如果没有 Bearer 前缀，直接使用整个值作为 token
  // 这样可以兼容前端直接发送 token 的情况
  return authHeader;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: extractJwtFromHeader,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // 添加调试日志
    console.log('[JWT Strategy] Validating payload:', {
      sub: payload?.sub,
      iat: payload?.iat,
      exp: payload?.exp,
    });

    if (!payload || !payload.sub) {
      console.error('[JWT Strategy] Invalid payload:', payload);
      throw new UnauthorizedExceptionWithCode(
        '无效的 token',
        ErrorCode.TOKEN_INVALID,
      );
    }

    const user = await this.userService.findById(payload.sub);
    if (!user) {
      console.error('[JWT Strategy] User not found:', payload.sub);
      throw new UnauthorizedExceptionWithCode(
        '用户不存在',
        ErrorCode.USER_NOT_FOUND,
      );
    }
    if (user.status === UserStatus.DISABLED) {
      console.error('[JWT Strategy] User disabled:', payload.sub);
      throw new UnauthorizedExceptionWithCode(
        '账户已被禁用',
        ErrorCode.USER_DISABLED,
      );
    }

    console.log('[JWT Strategy] User validated successfully:', {
      userId: user.id,
      username: user.username,
      authScope: user.authScope,
    });

    return {
      userId: user.id,
      username: user.username,
      authScope: user.authScope || '', // 默认权限范围
    };
  }
}
