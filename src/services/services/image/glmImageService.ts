import { baseFetch } from '../http/baseFetch';
import { GlmBaseService } from '../baseServices/glmBaseService';
import type {
  ImageServiceDefinition,
  ImageRequestParams,
  ImageResponse,
  ImageServiceName,
} from './types';
import { waitTask } from '../lib/waitTask';

export class GlmImageService extends GlmBaseService implements ImageServiceDefinition {
  name: ImageServiceName = 'image_glm';

  async execute(params: ImageRequestParams): Promise<ImageResponse | undefined> {
    const { prompt, model = 'Cogview-3-Flash', size = '1024x1024' } = params;
    const response = await baseFetch({
      method: 'POST',
      url: this.buildApiUrl('/api/paas/v4/images/generations'),
      headers: this.getCommonHeaders(),
      body: {
        prompt,
        model,
        size,
      },
    });
    if (response?.data?.yrl) {
      return {
        imageUrls: response.data,
      };
    }
  }
}
