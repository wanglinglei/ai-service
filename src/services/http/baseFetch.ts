/*
 * @Author: wanglinglei
 * @Date: 2025-10-17 10:10:35
 * @Description: 基础请求方法
 * @FilePath: /ai-ali/src/services/http/baseFetch.ts
 * @LastEditTime: 2025-10-17 13:59:10
 */
export interface BaseRequestParams {
  method: 'POST' | 'GET';
  url: string;
  headers: Record<string, string>;
  body: Record<string, any>;
}

export const baseFetch = async (params: BaseRequestParams) => {
  const { method, url, headers, body } = params;
  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${error}`);
  }
  const responseData = await response.json();
  return responseData;
};
