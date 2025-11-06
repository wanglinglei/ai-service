import { Module } from '@nestjs/common';
import { AlipayAuthController } from './alipay-auth.controller';
import { AlipayAuthService } from './alipay-auth.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [AlipayAuthController],
  providers: [AlipayAuthService],
})
export class AlipayAuthModule {}
