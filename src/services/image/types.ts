export interface ImageRequestParams {
  prompt: string;
  model?: string;
  size?: string;
}

export interface ImageResponse {
  imageUrls: { url: string }[];
}

import type { ServiceDefinition } from '../http/types';

export type ImageServiceName = 'image_glm' | 'image_ty';
export interface ImageServiceDefinition
  extends ServiceDefinition<ImageRequestParams, ImageResponse | undefined> {
  name: ImageServiceName;
}
