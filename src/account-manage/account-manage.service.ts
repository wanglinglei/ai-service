import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountEnv } from './entitys/account.entity';
import { GroupedAccount } from './Vo/account.vo';
import { CreateAccountDto } from './Dto/create-account.dto';
import { UpdateAccountDto } from './Dto/update-account.dto';

@Injectable()
export class AccountManageService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  /**
   * 获取账户列表，按 appKey 分组返回数组
   */
  async getAccountList(): Promise<GroupedAccount[]> {
    const accounts = await this.accountRepository.find();

    // 按 appKey 分组
    const groupedMap = accounts.reduce(
      (acc, account) => {
        const key = account.appKey;

        if (!acc[key]) {
          acc[key] = {
            label: account.appName,
            value: account.appKey,
            data: [],
          };
        }

        acc[key].data.push({
          env: account.env === AccountEnv.PROD ? 'production' : 'test',
          env_label: account.env === AccountEnv.PROD ? '生产' : '测试',
          username: account.userName,
          password: account.password,
        });

        return acc;
      },
      {} as Record<string, GroupedAccount>,
    );

    // 转为数组返回
    return Object.values(groupedMap);
  }

  /**
   * 创建应用账号
   */
  async createAccount(createAccountDto: CreateAccountDto): Promise<Account> {
    const account = this.accountRepository.create({
      appName: createAccountDto.appName,
      appKey: createAccountDto.appKey,
      env: createAccountDto.env,
      userName: createAccountDto.userName || 'SmartTube',
      password: createAccountDto.password,
    });

    return this.accountRepository.save(account);
  }

  /**
   * 更新应用账号
   */
  async updateAccount(updateAccountDto: UpdateAccountDto): Promise<Account> {
    const { id, ...updateData } = updateAccountDto;

    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`账号 ID ${id} 不存在`);
    }

    // 合并更新数据
    Object.assign(account, updateData);

    return this.accountRepository.save(account);
  }
}
