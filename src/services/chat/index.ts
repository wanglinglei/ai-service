import { GlmChatService } from './glmChatService';
import { TyChatService } from './tyChatService';

export const chatServiceNameConfig = {
  chat: [
    {
      label: '通义千问 ',
      value: 'chat_ty',
    },
    {
      label: '智谱',
      value: 'chat_glm',
    },
  ],
};

export { GlmChatService, TyChatService };
