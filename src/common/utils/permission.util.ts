import { ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '../config/error-code.config';

/**
 * 带错误码的权限异常
 */
class ForbiddenExceptionWithCode extends ForbiddenException {
  constructor(
    message: string,
    public readonly errCode: ErrorCode,
  ) {
    super({ message, errCode });
  }
}

/**
 * 功能名称映射
 * 将路径中的功能名称映射到 authScope 中的权限名称
 */
const FEATURE_MAP: Record<string, string> = {
  chat: 'chat',
  image: 'image',
  video: 'video',
  'docx-process': 'docx', // 路径是 docx-process，但权限是 docx
};

/**
 * 从路径中提取功能名称
 * 例如：/ai-service/chat/chat -> chat
 */
export function extractFeatureFromPath(path: string): string | null {
  // 移除查询参数
  const cleanPath = path.split('?')[0];

  // 匹配 /ai-service/{feature}/... 格式
  const match = cleanPath.match(/\/ai-service\/([^/]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * 检查用户是否有权限访问指定功能
 * @param authScope 用户的授权范围，格式：'chat,image,video,docx'
 * @param feature 功能名称，例如：'chat', 'image', 'video', 'docx-process'
 * @returns 是否有权限
 */
export function hasPermission(authScope: string, feature: string): boolean {
  if (!authScope || !feature) {
    return false;
  }

  // 将 authScope 字符串转换为数组
  const scopes = authScope.split(',').map((s) => s.trim());

  // 获取功能对应的权限名称
  const permissionName = FEATURE_MAP[feature] || feature;

  // 检查权限列表中是否包含该权限
  return scopes.includes(permissionName);
}

/**
 * 验证用户权限，如果没有权限则抛出异常
 * @param authScope 用户的授权范围
 * @param path 请求路径
 * @throws ForbiddenException 如果没有权限
 */
export function validatePermission(authScope: string, path: string): void {
  const feature = extractFeatureFromPath(path);

  // 如果没有提取到功能名称，可能是用户相关接口或其他接口，默认允许
  if (!feature) {
    return;
  }
  if (feature === 'general' || feature === 'user') {
    return;
  }

  // 检查权限
  if (!hasPermission(authScope, feature)) {
    const featureName = FEATURE_MAP[feature] || feature;
    throw new ForbiddenExceptionWithCode(
      `您没有访问 ${featureName} 功能的权限，请联系管理员`,
      ErrorCode.FEATURE_PERMISSION_DENIED,
    );
  }
}
