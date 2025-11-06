import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { UnifiedResponse } from '../../services/http/types';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, UnifiedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<UnifiedResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const controller = context.getClass().name;

    // 从路由路径中提取功能名称
    const url = request.url || '';
    const routePath = (request as { route?: { path?: string } }).route?.path;
    const route = routePath || url;
    const feature = this.extractFeature(route, controller, url);

    return next.handle().pipe(
      map((data) => {
        // 统一包装所有响应为 UnifiedResponse 格式
        return {
          success: true,
          data: data as T,
          code: 200,
          feature,
        };
      }),
    );
  }

  /**
   * 从路由路径和控制器名称中提取功能名称
   */
  private extractFeature(
    route: string,
    controller: string,
    url: string,
  ): string | undefined {
    // 从 URL 路径提取（例如：/ai-service/user/profile -> user）
    // 先尝试从完整 URL 中提取
    const urlMatch = url.match(/\/ai-service\/([^/?]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // 从路由路径提取（例如：/user/profile -> user）
    const routeMatch = route.match(/\/([^/]+)/);
    if (routeMatch && routeMatch[1] !== 'ai-service') {
      return routeMatch[1];
    }

    // 从控制器名称提取（例如：UserController -> user）
    const controllerMatch = controller.match(/(\w+)Controller/);
    if (controllerMatch) {
      return controllerMatch[1].toLowerCase();
    }

    return undefined;
  }
}
