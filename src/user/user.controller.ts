import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './DTO/registerDto';
import { LoginDto } from './DTO/loginDto';
import { Request as ExpressRequest } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/health')
  health(): string {
    return 'ok';
  }

  @Post('/register')
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: ExpressRequest,
  ) {
    return this.userService.register(registerDto, req);
  }

  @Post('/login')
  async login(@Body() loginDto: LoginDto, @Request() req: ExpressRequest) {
    return this.userService.login(loginDto, req);
  }

  @Get('/captcha')
  async getCaptcha(@Request() req: ExpressRequest) {
    const { data } = await this.userService.getCaptcha(req.session);
    return {
      image: `data:image/svg+xml;base64,${Buffer.from(data).toString('base64')}`,
    };
  }

  @Get('/profile')
  async getProfile(@Request() req: Request & { user: { userId: number } }) {
    const user = await this.userService.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      gender: user.gender,
      source: user.source,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
