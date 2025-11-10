import { baseFetch } from '../http/baseFetch';
import { TyBaseService } from '../baseServices/tyBaseService';
import type {
  ImageServiceDefinition,
  ImageRequestParams,
  ImageResponse,
  ImageServiceName,
} from './types';
import { waitTask } from '../lib/waitTask';

export class TyImageService
  extends TyBaseService
  implements ImageServiceDefinition
{
  name: ImageServiceName = 'image_ty';

  async execute(
    params: ImageRequestParams,
  ): Promise<ImageResponse | undefined> {
    const {
      prompt,
      model = 'wan2.5-t2i-preview',
      size = '1024x1024',
      n = 1,
    } = params;
    const response = await baseFetch({
      method: 'POST',
      url: this.buildApiUrl('/api/v1/services/aigc/text2image/image-synthesis'),
      headers: this.getAsyncHeaders(),
      body: {
        model,
        input: {
          prompt,
        },
        n: n,
        parameters: {
          size,
          watermark: false,
          seed: 10000,
        },
      },
    });
    if (response?.output?.task_id) {
      const taskResponse = await waitTask({
        taskId: response.output.task_id,
        sign: 'ty',
        checkTaskCompleted: (result) =>
          result.output?.task_status === 'SUCCEEDED',
        checkTaskFailed: (result) => result.output?.task_status === 'FAILED',
      });
      if (taskResponse?.output?.results) {
        return {
          imageUrls: taskResponse.output.results,
        };
      }
    }
  }
}
