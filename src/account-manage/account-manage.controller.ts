import { Controller, Get, Post, Body } from '@nestjs/common';
import { AccountManageService } from './account-manage.service';
import { CreateAccountDto } from './Dto/create-account.dto';
import { UpdateAccountDto } from './Dto/update-account.dto';

@Controller('account-manage')
export class AccountManageController {
  constructor(private readonly accountManageService: AccountManageService) {}

  @Get('list')
  async getAccountList() {
    return this.accountManageService.getAccountList();
  }

  @Post('create')
  async createAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.accountManageService.createAccount(createAccountDto);
  }

  @Post('update')
  async updateAccount(@Body() updateAccountDto: UpdateAccountDto) {
    return this.accountManageService.updateAccount(updateAccountDto);
  }
}
