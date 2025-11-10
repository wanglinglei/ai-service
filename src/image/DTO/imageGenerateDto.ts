export interface tyImageGenerateDto {
  prompt: string;
  model?: string;
  size?: string;
  provider: string;
}

export interface glmImageGenerateDto {
  prompt: string;
  model?: string;
  size?: string;
  provider: string;
}

export type ImageGenerateDto = tyImageGenerateDto | glmImageGenerateDto;
