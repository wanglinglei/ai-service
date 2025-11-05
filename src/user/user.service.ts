import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserSource, Gender, UserStatus } from './user.entity';
import { RegisterDto } from './DTO/registerDto';
import { LoginDto } from './DTO/loginDto';
import { AuthResponseDto } from './DTO/authResponseDto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 注册用户
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, password, nickname, email, avatar, gender } = registerDto;

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
      avatar,
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
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { username, password } = loginDto;

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
   * 生成 JWT token
   */
  private generateToken(user: User): string {
    const payload = { sub: user.id, username: user.username };
    return this.jwtService.sign(payload);
  }
}
