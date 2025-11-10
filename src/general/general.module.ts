import { Module } from '@nestjs/common';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';
import { CosService } from '../lib/cosService';
import { VerificationService } from '../lib/verificationService';

@Module({
  controllers: [GeneralController],
  providers: [GeneralService, CosService, VerificationService],
  exports: [GeneralService], // 导出服务供其他模块使用
})
export class GeneralModule {}
