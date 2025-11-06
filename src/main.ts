import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';

import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// 加载环境变量
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 前端地址（本地开发）
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

  // 允许跨域请求 - 明确指定前端地址
  app.enableCors({
    origin: frontendOrigin, // 明确指定前端地址
    credentials: true, // 允许携带 cookie
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 配置 session
  app.use(
    session({
      name: 'ai-service.sid', // 设置 session cookie 名称
      secret: process.env.SESSION_SECRET || 'your-session-secret-key',
      resave: false,
      saveUninitialized: true, // 改为 true，确保新 session 被保存
      cookie: {
        maxAge: 3 * 60 * 1000, // 3分钟过期
        httpOnly: true,
        secure: false, // 本地开发使用 false
        // 本地开发时不设置 sameSite，让浏览器使用默认行为
        // 生产环境需要设置 sameSite: 'lax' 或 'strict'
        ...(process.env.NODE_ENV === 'production' && { sameSite: 'lax' }),
      },
    }),
  );

  // 注册全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 注册全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 配置全局路径前缀
  app.setGlobalPrefix('ai-service');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Frontend origin: ${frontendOrigin}`);
}
void bootstrap();
