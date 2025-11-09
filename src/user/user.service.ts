import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Request,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Request as ExpressRequest } from 'express';
import { User, UserSource, Gender, UserStatus } from './entitys/user.entity';
import { RegisterDto, UpdateUserDto, LoginDto, AuthResponseDto } from './DTO';

import { GeneralService } from '../general/general.service';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private generalService: GeneralService,
  ) {}

  /**
   * 注册用户
   */
  async register(
    registerDto: RegisterDto,
    req: ExpressRequest,
  ): Promise<boolean> {
    const {
      username,
      password,
      nickname = '',
      email,
      avatar,
      gender,
      captcha,
    } = registerDto;
    if (!this.generalService.verifyCaptcha(req.session, captcha)) {
      throw new BadRequestException('验证码错误或已过期');
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUserByUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 如果提供了邮箱，检查邮箱是否已被注册
    if (email) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUserByEmail) {
        throw new ConflictException('邮箱已被注册');
      }
    }

    // 加密密码
    const hashedPassword = await this.hashPassword(password);

    // 转换性别字符串为枚举
    let genderEnum: Gender = Gender.UNKNOWN;
    if (gender) {
      if (gender === 'male') {
        genderEnum = Gender.MALE;
      } else if (gender === 'female') {
        genderEnum = Gender.FEMALE;
      } else {
        genderEnum = Gender.UNKNOWN;
      }
    }

    // 创建用户
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      nickname,
      email,
      avatar:
        avatar ||
        'https://p3-passport.byteacctimg.com/img/user-avatar/5a3f65c1808beb286a51c56d7a0903b4~80x80.awebp',
      gender: genderEnum,
      source: UserSource.WEB,
    });

    await this.userRepository.save(user);
    return true;
  }

  /**
   * 用户登录
   */
  async login(
    loginDto: LoginDto,
    req: ExpressRequest,
  ): Promise<AuthResponseDto> {
    const { username, password, captcha } = loginDto;

    if (!this.generalService.verifyCaptcha(req.session, captcha)) {
      throw new BadRequestException('验证码错误或已过期');
    }

    // 查找用户
    const user = await this.userRepository.findOne({
      where: { username },
    });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await this.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('账户已被禁用');
    }

    // 生成 JWT token
    const accessToken = this.generateToken(user);

    return {
      accessToken,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        gender: user.gender,
        province: user.province,
        city: user.city,
      },
    };
  }

  /**
   * 更新用户信息
   */
  async update(updateDto: UpdateUserDto): Promise<User> {
    const { id, username, email, ...rest } = updateDto;
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser && existingUser.id !== id) {
      throw new ConflictException('用户名已存在');
    }

    // 如果提供了邮箱，检查邮箱是否已被注册
    if (email) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUserByEmail) {
        throw new ConflictException('邮箱已被注册');
      }
    }
    const updateUser: User = {
      ...user,
      ...updateDto,
    };
    return this.userRepository.save(updateUser);
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  /**
   * 根据 ID 查找用户
   */
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * 加密密码
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  private async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * 根据支付宝用户ID查找用户
   */
  async findBySourceUserId(sourceUserId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { sourceUserId: sourceUserId },
    });
  }

  /**
   * 创建支付宝用户
   */
  async createAlipayUser(userData: {
    username: string | null;
    nickname: string;
    alipayUserId: string;
    avatar?: string;
    gender?: 'male' | 'female' | 'unknown';
    province?: string;
    city?: string;
  }): Promise<User> {
    let genderEnum: Gender = Gender.UNKNOWN;
    if (userData.gender) {
      if (userData.gender === 'male') {
        genderEnum = Gender.MALE;
      } else if (userData.gender === 'female') {
        genderEnum = Gender.FEMALE;
      }
    }

    const user = this.userRepository.create({
      username: userData.username,
      password: await this.hashPassword(crypto.randomBytes(16).toString('hex')), // 随机密码
      nickname: userData.nickname,
      avatar: userData.avatar,
      gender: genderEnum,
      source: UserSource.ALIPAY,
      sourceUserId: userData.alipayUserId,
      province: userData.province,
      city: userData.city,
    });

    return this.userRepository.save(user);
  }

  /**
   * 更新用户信息
   */
  async updateUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  /**
   * 生成 JWT token
   * @param user 用户对象
   * @param expiresIn 有效期，默认从环境变量 JWT_EXPIRES_IN 读取，或使用 '1d'
   * 有效期格式支持：'1d' (1天), '2h' (2小时), '30m' (30分钟), '60s' (60秒) 等
   */
  generateToken(user: User, expiresIn?: string): string {
    const payload = { sub: user.id };
    const expires = expiresIn || process.env.JWT_EXPIRES_IN || '1d';
    return this.jwtService.sign(payload, {
      expiresIn: expires,
    } as any);
  }
}
