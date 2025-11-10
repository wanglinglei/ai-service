import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageGenerateDto } from './DTO/imageGenerateDto';
@Controller('image')
export class ImageController {
  private readonly logger = new Logger(ImageController.name);
  constructor(private readonly imageService: ImageService) {}

  @Get('/health')
  health(): string {
    return 'ok';
  }

  @Post('/generate')
  generate(@Body() body: ImageGenerateDto) {
    return this.imageService.generate(body);
  }
}
