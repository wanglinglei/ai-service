import { request } from './request';

interface VideoGeneratorParams {
  prompt: string;
  model?: string;
  parameters?: {
    size?: string;
    prompt_extend: boolean;
    duration?: number;
    audio?: boolean;
  };
}

export const videoGenerator = async (params: VideoGeneratorParams) => {
  const { prompt, model = 'wan2.5-t2v-preview', parameters = {} } = params;
  return request({
    api: '/api/v1/services/aigc/video-generation/video-synthesis',
    method: 'POST',
    body: {
      model,
      input: {
        prompt,
      },
      parameters,
    },
    dashScopeAsync: 'enable',
  });
};
