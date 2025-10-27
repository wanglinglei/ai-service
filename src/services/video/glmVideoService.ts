import { baseFetch } from '../http/baseFetch';
import { GlmBaseService } from '../baseServices/glmBaseService';
import type {
  VideoServiceDefinition,
  VideoRequestParams,
  VideoResponse,
  VideoServiceName,
} from './types';
import { waitTask } from '../lib/waitTask';

export class GlmVideoService extends GlmBaseService implements VideoServiceDefinition {
  name: VideoServiceName = 'video_glm';

  async execute(params: VideoRequestParams): Promise<VideoResponse | undefined> {
    const response = await baseFetch({
      method: 'POST',
      url: this.buildApiUrl('/api/paas/v4/videos/generations'),
      headers: this.getCommonHeaders(),
      body: {
        prompt: params.prompt,
        model: 'CogVideoX-Flash',
      },
    });
    if (response?.id) {
      const taskResponse = await waitTask({
        taskId: response.id,
        sign: 'glm',
        checkTaskCompleted: (result) => !!result.video_result?.[0]?.url,
      });
      if (taskResponse?.video_result?.[0]?.url) {
        return {
          videoUrl: taskResponse.video_result[0].url,
        };
      }
    }
    return undefined;
  }
}
