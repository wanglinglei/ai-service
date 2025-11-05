import { Controller, Get, Post, Body } from '@nestjs/common';
import { VideoGenerateDto } from './DTO/videoGenerateDto';
import { VideoService } from './video.service';
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}
  @Get('/health')
  health(): string {
    return 'ok';
  }
  @Post('/generate')
  generate(@Body() body: VideoGenerateDto) {
    return this.videoService.generate(body);
  }
}
