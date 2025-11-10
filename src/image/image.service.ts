import { Injectable, Logger } from '@nestjs/common';
import { serviceController } from 'src/services';
import { ImageGenerateDto } from './DTO/imageGenerateDto';
@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  async generate(body: ImageGenerateDto) {
    const { prompt, model, size, provider } = body;
    const data = await serviceController.executeService(
      'image',
      `image_${provider}`,
      { prompt, model, size },
    );
    return data;
  }
}
