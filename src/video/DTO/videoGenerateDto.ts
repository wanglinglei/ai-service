export interface VideoGenerateInput {
  prompt: string; // 提示词
  negative_prompt?: string; // 反选提示词
}

export interface VideoGenerateParameters {
  size: string; // 视频尺寸
  prompt_extend: boolean;
  duration?: number; // 视频时长
  audio?: boolean; // 是否包含音频
}

export interface VideoGenerateDto {
  model: string;
  input: VideoGenerateInput;
  parameters: VideoGenerateParameters;
  provider: string;
}
