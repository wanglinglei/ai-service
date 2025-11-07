import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { isWhitelisted } from '../config/auth.config';
import { validatePermission } from '../utils/permission.util';
import { ErrorCode } from '../config/error-code.config';

/**
 * 带错误码的未授权异常
 */
class UnauthorizedExceptionWithCode extends UnauthorizedException {
  constructor(
    message: string,
    public readonly errCode: ErrorCode,
  ) {
    super({ message, errCode });
  }
}

/**
 * JWT 认证后的用户信息类型
 */
export interface JwtUser {
  userId: number;
  username: string;
  authScope: string;
}

/**
 * 白名单装饰器，用于标记不需要认证的路由
 * 使用方式：在 Controller 或 Handler 上添加 @Public() 装饰器
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * 全局 JWT 认证 Guard
 * 支持白名单配置，白名单路径跳过认证
 * 支持基于授权范围的权限控制
 *
 * 白名单配置方式：
 * 1. 使用 @Public() 装饰器标记路由
 * 2. 在 auth.config.ts 中配置路径白名单
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * 判断是否需要认证
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 检查是否使用了 @Public() 装饰器
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const path = request.url?.split('?')[0] || ''; // 移除查询参数

    // 检查路径是否在白名单中
    if (isWhitelisted(path)) {
      return true;
    }

    // 其他路径需要认证
    return super.canActivate(context);
  }

  /**
   * 处理认证失败的情况
   * 注意：参数签名必须与基类匹配，未使用的参数使用下划线前缀
   */
  handleRequest<TUser = JwtUser>(
    err: any,
    user: any,

    _info: any,
    context: ExecutionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _status?: any,
  ): TUser {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.url?.split('?')[0] || '';

    // 添加调试日志
    console.log('[JWT Guard] handleRequest called:', {
      path,
      hasError: !!err,
      hasUser: !!user,
      errorMessage:
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : undefined,
      authorizationHeader:
        request.headers.authorization?.substring(0, 20) + '...',
    });

    // 处理 token 过期错误
    if (err) {
      // TokenExpiredError 是 jsonwebtoken 库抛出的过期错误
      // 使用类型守卫安全地访问错误属性
      const isExpiredError =
        (err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name?: string }).name === 'TokenExpiredError') ||
        (err &&
          typeof err === 'object' &&
          'message' in err &&
          typeof (err as { message?: unknown }).message === 'string' &&
          ((err as { message: string }).message.includes('expired') ||
            (err as { message: string }).message.includes('过期')));

      if (isExpiredError) {
        throw new UnauthorizedExceptionWithCode(
          'Token 已过期，请重新登录',
          ErrorCode.TOKEN_EXPIRED,
        );
      }
      // 其他认证错误
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedExceptionWithCode(
            '未授权，请先登录',
            ErrorCode.UNAUTHORIZED,
          );
    }

    if (!user) {
      throw new UnauthorizedExceptionWithCode(
        '未授权，请先登录',
        ErrorCode.UNAUTHORIZED,
      );
    }

    // 认证成功后，检查用户权限
    // 验证用户是否有权限访问该功能
    const jwtUser = user as JwtUser;
    if (jwtUser.authScope) {
      validatePermission(jwtUser.authScope, path);
    }

    return user as TUser;
  }
}
