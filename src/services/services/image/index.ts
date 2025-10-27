import { GlmImageService } from './glmImageService';
import { TyImageService } from './tyImageService';

export const imageServiceNameConfig = {
  image: [
    {
      label: '智谱',
      value: 'image_glm',
    },
    {
      label: '通义千问 ',
      value: 'image_ty',
    },
  ],
};
export { GlmImageService, TyImageService };
