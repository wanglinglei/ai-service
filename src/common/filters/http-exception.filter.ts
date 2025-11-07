import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UnifiedResponse } from '../../services/http/types';

interface ExceptionResponse {
  message?: string | string[];
  code?: number;
  [key: string]: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = 500;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as ExceptionResponse;
        const responseMessage = Array.isArray(responseObj.message)
          ? responseObj.message[0]
          : responseObj.message;
        message = responseMessage || exception.message || '请求失败';
        code = responseObj.code || status;
      } else {
        message = exception.message || '请求失败';
      }
      code = status;
    } else if (exception instanceof Error) {
      message = exception.message || '服务器内部错误';
      code = 500;
    }

    // 从路由路径中提取功能名称
    const route =
      (request.route as { path?: string } | undefined)?.path || request.url;
    const feature = this.extractFeature(route);

    // 记录错误日志
    // 对于认证错误（401）和权限错误（403），不记录日志，直接返回给前端
    if (
      status !== HttpStatus.UNAUTHORIZED &&
      status !== HttpStatus.FORBIDDEN
    ) {
      this.logger.error(
        `HTTP ${status} Error: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const errorResponse: UnifiedResponse = {
      success: false,
      error: message,
      code,
      feature,
    };

    response.status(status).json(errorResponse);
  }

  /**
   * 从路由路径中提取功能名称
   */
  private extractFeature(route: string): string | undefined {
    // 从路由路径提取（例如：/ai-service/user/profile -> user）
    const routeMatch = route.match(/\/ai-service\/([^/]+)/);
    if (routeMatch) {
      return routeMatch[1];
    }

    // 如果没有匹配到，尝试直接匹配第一个路径段
    const directMatch = route.match(/\/([^/]+)/);
    if (directMatch && directMatch[1] !== 'ai-service') {
      return directMatch[1];
    }

    return undefined;
  }
}
