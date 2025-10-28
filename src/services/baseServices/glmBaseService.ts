/**
 * GLM 服务基类
 * 提供 GLM API 的通用配置和基础功能
 */
export abstract class GlmBaseService {
  protected readonly GLM_API_KEY: string;
  protected readonly GLM_API_URL: string;

  constructor() {
    this.GLM_API_KEY = process.env.GLM_API_KEY || '';
    this.GLM_API_URL = process.env.GLM_API_URL || '';
  }

  /**
   * 获取 GLM API 的通用请求头
   */
  protected getCommonHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.GLM_API_KEY}`,
    };
  }

  /**
   * 构建 GLM API 的完整 URL
   */
  protected buildApiUrl(endpoint: string): string {
    return `${this.GLM_API_URL}${endpoint}`;
  }
}
