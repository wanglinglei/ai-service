/**
 * TY（通义千问）服务基类
 * 提供 TY API 的通用配置和基础功能
 */
export abstract class TyBaseService {
  protected readonly TY_API_KEY: string;
  protected readonly TY_API_URL: string;

  constructor() {
    this.TY_API_KEY = process.env.TY_API_KEY;
    this.TY_API_URL = process.env.VITE_TY_API_URL;
  }

  /**
   * 获取 TY API 的通用请求头
   */
  protected getCommonHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.TY_API_KEY}`,
    };
  }

  /**
   * 获取 TY API 的异步请求头（用于视频生成等异步任务）
   */
  protected getAsyncHeaders(): Record<string, string> {
    return {
      ...this.getCommonHeaders(),
      'X-DashScope-Async': 'enable',
    };
  }

  /**
   * 构建 TY API 的完整 URL
   */
  protected buildApiUrl(endpoint: string): string {
    return `${this.TY_API_URL}${endpoint}`;
  }
}
