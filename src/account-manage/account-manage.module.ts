import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountManageService } from './account-manage.service';
import { AccountManageController } from './account-manage.controller';
import { Account } from './entitys/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [AccountManageService],
  controllers: [AccountManageController],
})
export class AccountManageModule {}
