import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { RegisterDto } from './DTO/registerDto';
import { LoginDto } from './DTO/loginDto';

interface RequestWithSession extends Request {
  session: {
    captcha?: string;
    [key: string]: any;
  };
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/health')
  health(): string {
    return 'ok';
  }

  @Post('/register')
  async register(@Body() registerDto: RegisterDto) {
    return this.userService.register(registerDto);
  }

  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }

  @Get('/captcha')
  getCaptcha(@Request() req: RequestWithSession) {
    const { data } = this.userService.getCaptcha(req.session);
    return {
      image: `data:image/svg+xml;base64,${Buffer.from(data).toString('base64')}`,
    };
  }

  @Get('/profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req) {
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
