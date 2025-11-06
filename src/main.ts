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
  // 允许跨域请求
  app.enableCors({
    origin: true,
    credentials: true, // 允许携带 cookie
  });

  // 配置 session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-session-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 3 * 60 * 1000, // 3分钟过期
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // 生产环境使用 HTTPS
      },
    }),
  );

  // 注册全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 注册全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 配置全局路径前缀
  app.setGlobalPrefix('ai-service');
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
