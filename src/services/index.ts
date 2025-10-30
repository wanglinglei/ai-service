import * as dotenv from 'dotenv';

import { ServiceRegistry, ServiceExecutor } from './http';
import {
  GlmChatService,
  TyChatService,
  chatServiceNameConfig,
} from './chat/index';
import {
  GlmVideoService,
  TyVideoService,
  videoServiceNameConfig,
} from './video/index';
import {
  GlmImageService,
  TyImageService,
  imageServiceNameConfig,
} from './image/index';

dotenv.config();

const serviceRegistry = new ServiceRegistry();
serviceRegistry.registerService(new GlmChatService());
serviceRegistry.registerService(new TyChatService());
serviceRegistry.registerService(new GlmVideoService());
serviceRegistry.registerService(new TyVideoService());
serviceRegistry.registerService(new GlmImageService());
serviceRegistry.registerService(new TyImageService());

serviceRegistry.configureFeatureServices({
  ...chatServiceNameConfig,
  ...videoServiceNameConfig,
  ...imageServiceNameConfig,
});

const serviceExecutor = new ServiceExecutor(serviceRegistry);

class ServiceController {
  async executeService(feature: string, selectedService: string, params: any) {
    return await serviceExecutor.executeFeatureService(
      feature,
      selectedService,
      params,
    );
  }
}

const serviceController = new ServiceController();
export { serviceController };
