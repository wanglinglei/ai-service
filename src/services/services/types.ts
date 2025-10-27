export interface BaseRequestParams {
  method: 'POST' | 'GET';
  api: string;
  contentType?: string;
  body: Record<string, any>;
  dashScopeAsync?: string;
}
