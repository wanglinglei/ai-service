import { Injectable, BadRequestException } from '@nestjs/common';
import { serviceController } from 'src/services';
import { VideoGenerateDto } from './DTO/videoGenerateDto';
@Injectable()
export class VideoService {
  async generate(params: VideoGenerateDto) {
    const { model, input, parameters, provider } = params;
    try {
      const data = await serviceController.executeService(
        'video',
        `video_${provider}`,
        {
          model,
          input,
          parameters,
        },
      );
      return data;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : '视频生成服务调用失败',
      );
    }
  }
}
