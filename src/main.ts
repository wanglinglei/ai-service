import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';
import * as fs from 'fs';
import * as path from 'path';

import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// 加载环境变量
dotenv.config();

/**
 * 确保 uploads 目录存在
 * 注意：如果使用 Docker 卷挂载，目录权限由宿主机决定，容器内无法修改
 */
async function ensureUploadsDirectory() {
  const uploadsDir = path.join(process.cwd(), 'uploads');

  try {
    // 检查目录是否存在
    if (!fs.existsSync(uploadsDir)) {
      // 创建目录，设置权限为 0o755 (rwxr-xr-x)
      await fs.promises.mkdir(uploadsDir, { recursive: true, mode: 0o755 });
      console.log(`✅ 已创建 uploads 目录: ${uploadsDir}`);
    } else {
      // 目录已存在，不尝试修改权限（卷挂载时可能没有权限）
      // 检查目录是否可访问
      try {
        await fs.promises.access(
          uploadsDir,
          fs.constants.R_OK | fs.constants.W_OK,
        );
        console.log(`✅ uploads 目录已存在且可访问: ${uploadsDir}`);
      } catch (accessError) {
        console.warn(
          `⚠️ uploads 目录存在但可能无法访问: ${uploadsDir}`,
          accessError,
        );
        // 不抛出错误，让应用继续启动，实际使用时再处理
      }
    }
  } catch (error) {
    // 创建目录失败，记录错误但不阻止启动
    // 如果目录已通过卷挂载存在，创建失败是正常的
    console.warn(`⚠️ 无法创建 uploads 目录: ${uploadsDir}`, error);
    console.warn(`⚠️ 如果使用 Docker 卷挂载，请确保宿主机目录存在且权限正确`);
  }
}

async function bootstrap() {
  // 确保 uploads 目录存在
  await ensureUploadsDirectory();

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
