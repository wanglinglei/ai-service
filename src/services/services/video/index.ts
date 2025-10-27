import { GlmVideoService } from './glmVideoService';
import { TyVideoService } from './tyVideoService';

export const videoServiceNameConfig = {
  video: [
    {
      label: '通义千问 ',
      value: 'video_ty',
    },
    {
      label: '智谱',
      value: 'video_glm',
    },
  ],
};

export { GlmVideoService, TyVideoService };
