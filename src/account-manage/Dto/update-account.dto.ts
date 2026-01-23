import { AccountEnv } from '../entitys/account.entity';

export interface UpdateAccountDto {
  /** 账号ID */
  id: number;
  /** 应用名称 */
  appName?: string;
  /** 应用key */
  appKey?: string;
  /** 环境 */
  env?: AccountEnv;
  /** 用户名 */
  userName?: string;
  /** 密码 */
  password?: string;
}
