import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocxProcessModule } from './docx-process/docx-process.module';
import { ChatModule } from './chat/chat.module';
import { VideoModule } from './video/video.module';
import { ImageModule } from './image/image.module';
import { UserModule } from './user/user.module';
import { AlipayAuthModule } from './alipay-auth/alipay-auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 自动同步数据库表结构（表不存在时自动创建）
    }),
    DocxProcessModule,
    ChatModule,
    VideoModule,
    ImageModule,
    UserModule,
    AlipayAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
