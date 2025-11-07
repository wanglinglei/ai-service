import { Controller, Get, Request } from '@nestjs/common';
import { GeneralService } from './general.service';
import { Request as ExpressRequest } from 'express';
@Controller('general')
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}
  @Get('/health')
  health(): string {
    return 'ok';
  }

  @Get('/captcha')
  async getCaptcha(@Request() req: ExpressRequest) {
    const { data } = await this.generalService.getCaptcha(req.session);
    return {
      image: `data:image/svg+xml;base64,${Buffer.from(data).toString('base64')}`,
    };
  }
}
