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

/**
 * 白名单装饰器，用于标记不需要认证的路由
 * 使用方式：在 Controller 或 Handler 上添加 @Public() 装饰器
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * 全局 JWT 认证 Guard
 * 支持白名单配置，白名单路径跳过认证
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
  handleRequest<TUser = any>(
    err: any,
    user: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _info: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ExecutionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _status?: any,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('未授权，请先登录');
    }
    return user as TUser;
  }
}
