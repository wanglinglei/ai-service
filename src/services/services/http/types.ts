export interface BaseRequestParams {
  method: 'POST' | 'GET';
  api: string;
  contentType?: string;
  body: Record<string, any>;
  dashScopeAsync?: string;
}

export interface ServiceNameConfig {
  label: string;
  value: string;
}

export interface ConfigServiceNameConfig {
  [feature: string]: ServiceNameConfig[];
}

// 功能-服务映射配置
export interface FeatureServiceConfig {
  [feature: string]: string[]; // 功能对应的可用服务列表
}

// 服务定义
export interface ServiceDefinition<TParams = any, TResponse = any> {
  name: string;
  execute: (params: TParams) => Promise<TResponse>;
  validate?: (params: TParams) => boolean;
}

// 统一响应格式
export interface UnifiedResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  serviceName?: string;
  feature?: string;
}

// 服务执行选项
export interface ServiceExecuteOptions {
  fallbackServices?: string[]; // 降级服务列表
  timeout?: number;
  retryCount?: number;
}
