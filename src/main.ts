import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 允许跨域请求
  app.enableCors();

  // 配置全局路径前缀
  app.setGlobalPrefix('ai-service');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
