import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AccountEnv {
  PROD = 'prod',
  TEST = 'test',
}

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, comment: '应用名称' })
  appName: string;
  @Column({ type: 'varchar', length: 10, comment: '应用key' })
  appKey: string;

  @Column({
    type: 'enum',
    enum: AccountEnv,
    default: AccountEnv.PROD,
    comment: '环境',
  })
  env: AccountEnv;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'SmartTube',
    comment: '用户名',
  })
  userName: string;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
