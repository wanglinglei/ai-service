import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Request,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as svgCaptcha from 'svg-captcha';
import { Request as ExpressRequest } from 'express';
import { User, UserSource, Gender, UserStatus } from './entitys/user.entity';
import { RegisterDto } from './DTO/registerDto';
import { LoginDto } from './DTO/loginDto';
import { AuthResponseDto } from './DTO/authResponseDto';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 注册用户
   */
  async register(
    registerDto: RegisterDto,
    req: ExpressRequest,
  ): Promise<AuthResponseDto> {
    const {
      username,
      password,
      nickname = '',
      email,
      avatar,
      gender,
      captcha,
    } = registerDto;
    if (!this.verifyCaptcha(req.session, captcha)) {
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

    const savedUser = await this.userRepository.save(user);

    // 生成 JWT token
    const access_token = this.generateToken(savedUser);

    return {
      access_token,
      user: {
        id: savedUser.id,
        username: savedUser.username,
        nickname: savedUser.nickname,
        email: savedUser.email,
        avatar: savedUser.avatar,
      },
    };
  }

  /**
   * 用户登录
   */
  async login(
    loginDto: LoginDto,
    req: ExpressRequest,
  ): Promise<AuthResponseDto> {
    const { username, password, captcha } = loginDto;

    if (!this.verifyCaptcha(req.session, captcha)) {
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
    const access_token = this.generateToken(user);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
      },
    };
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
    username: string;
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
   */
  generateToken(user: User): string {
    const payload = { sub: user.id, username: user.username };
    return this.jwtService.sign(payload);
  }

  /**
   * 生成图形验证码
   */
  async getCaptcha(
    session: ExpressRequest['session'],
  ): Promise<{ data: string }> {
    if (!session) {
      throw new Error('Session is not available');
    }

    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: '0o1il', // 忽略容易混淆的字符
      noise: 3, // 干扰线条数
      color: true, // 彩色
      background: '#f0f0f0', // 背景色
      width: 120,
      height: 40,
      fontSize: 50,
      charPreset: '123456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ', // 字符集
    });

    // 将验证码存储到 session（转换为小写以便验证时不区分大小写）
    (session as any).captcha = captcha.text.toLowerCase();

    // 记录 session ID 和验证码，用于调试
    this.logger.log(
      `Captcha generated: ${(session as any).captcha}, sessionID: ${(session as any).id || 'unknown'}`,
    );

    // 确保 session 被标记为已修改，以便保存
    // 使用 Promise 确保 session 保存完成后再返回
    return new Promise((resolve, reject) => {
      session.save((err) => {
        if (err) {
          this.logger.error('Session save error:', err);
          reject(err);
        } else {
          this.logger.log('Session saved successfully');
          resolve({
            data: captcha.data, // SVG 字符串
          });
        }
      });
    });
  }

  /**
   * 验证验证码
   */
  verifyCaptcha(session: ExpressRequest['session'], code: string): boolean {
    if (!session) {
      this.logger.warn('Session is not available');
      return false;
    }

    const sessionCaptcha = (session as any).captcha;
    const sessionId = (session as any).id || 'unknown';
    this.logger.log(
      `verifyCaptcha: code=${code}, session.captcha=${sessionCaptcha}, sessionID=${sessionId}`,
    );
    if (!code || !sessionCaptcha) {
      this.logger.warn(
        `Captcha verification failed: code=${code}, session.captcha=${sessionCaptcha}, sessionID=${sessionId}`,
      );
      return false;
    }

    // 验证码验证（不区分大小写）
    const isValid = sessionCaptcha === code.toLowerCase();

    // 验证后删除验证码（一次性使用）
    delete (session as any).captcha;

    // 确保 session 被标记为已修改
    session.save((err) => {
      if (err) {
        this.logger.error('Session save error after verification:', err);
      }
    });

    return isValid;
  }
}
