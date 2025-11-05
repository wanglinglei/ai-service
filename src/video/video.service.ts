import { Injectable } from '@nestjs/common';
import { serviceController } from 'src/services';
import { VideoGenerateDto } from './DTO/videoGenerateDto';
@Injectable()
export class VideoService {
  async generate(params: VideoGenerateDto) {
    const { model, input, parameters, provider } = params;
    const response = await serviceController.executeService(
      'video',
      `video_${provider}`,
      {
        model,
        input,
        parameters,
      },
    );
    return response;
  }
}
