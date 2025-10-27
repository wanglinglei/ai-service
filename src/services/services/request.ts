const BASE_URL = process.env.VITE_TY_BASE_URL;
const DASHSCOPE_API_KEY = process.env.VITE_DASHSCOPE_API_KEY;
import type { BaseRequestParams } from './types';

/**
 * @description: 等待异步任务完成
 * @param {string} taskId
 * @return {*}
 */
async function waitForTaskCompletion(
  taskId: string,
  maxAttempts = 60,
  delay = 5000,
) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.status}`);
    }

    const result = await response.json();
    console.log('result', result);
    if (result.output?.task_status === 'SUCCEEDED') {
      return result.output;
    } else if (result.output?.task_status === 'FAILED') {
      throw new Error(
        `Task failed: ${result.output.message || 'Unknown error'}`,
      );
    }

    // 等待后继续轮询
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error('Task timeout: exceeded maximum attempts');
}

export const request = async (params: BaseRequestParams) => {
  const {
    method,
    api,
    contentType = 'application/json',
    body,
    dashScopeAsync,
  } = params;

  let headers = {
    Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
    'Content-Type': contentType,
  } as Record<string, string>;
  if (dashScopeAsync) {
    headers['X-DashScope-Async'] = 'enable';
  }

  const response = await fetch(`${BASE_URL}${api}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${error}`,
    );
  }
  const responseData = await response.json();

  console.log('response', responseData);
  console.log('response.output', responseData.output?.task_id);
  // 如果是异步任务，返回任务ID
  if (responseData.output?.task_id) {
    // 等待任务完成并获取结果
    const result = await waitForTaskCompletion(responseData.output.task_id);
    return result;
  }
  return responseData;
};
