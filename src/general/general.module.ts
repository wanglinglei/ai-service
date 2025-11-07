import { Module } from '@nestjs/common';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';

@Module({
  controllers: [GeneralController],
  providers: [GeneralService],
  exports: [GeneralService], // 导出服务供其他模块使用
})
export class GeneralModule {}
