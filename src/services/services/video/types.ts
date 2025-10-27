export interface VideoRequestParams {
  prompt: string;
  model?: string;
}

export interface VideoResponse {
  videoUrl: string;
}

import type { ServiceDefinition } from '../http/types';

export type VideoServiceName = 'video_ty' | 'video_glm';
export interface VideoServiceDefinition
  extends ServiceDefinition<VideoRequestParams, VideoResponse | undefined> {
  name: VideoServiceName;
}
