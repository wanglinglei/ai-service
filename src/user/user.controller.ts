import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto, LoginDto, UpdateUserDto } from './DTO';
import { Request as ExpressRequest } from 'express';
import { JwtUser } from '../common/guards/jwt-auth.guard';

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

  @Post('/update')
  async update(
    @Body() updateDto: UpdateUserDto,
    @Request() req: ExpressRequest,
  ) {
    return this.userService.update(updateDto, req);
  }

  @Get('/profile')
  async getProfile(@Request() req: ExpressRequest & { user: JwtUser }) {
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
      authScope: user.authScope,
      createdAt: user.createdAt,
    };
  }
}
