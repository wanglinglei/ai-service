/**
 * 认证白名单配置
 * 配置不需要 JWT 认证的路径
 */

export interface WhitelistConfig {
  /**
   * 精确匹配的路径列表
   */
  exact?: string[];
  /**
   * 路径前缀匹配列表
   */
  prefix?: string[];
  /**
   * 正则表达式匹配列表
   */
  regex?: RegExp[];
}

/**
 * 默认白名单配置
 */
export const DEFAULT_WHITELIST: WhitelistConfig = {
  exact: [
    // 用户相关公开接口
    '/ai-service/user/register',
    '/ai-service/user/login',
    '/ai-service/alipay-auth/login',
    // 通用接口
    '/ai-service/general/captcha',
    '/ai-service/general/upload',
    '/ai-service/general/emailCode',
    // 健康检查接口
    '/ai-service/chat/health',
    '/ai-service/video/health',
    '/ai-service/image/health',
    '/ai-service/docx-process/health',
    '/ai-service/user/health',
    '/ai-service/alipay-auth/health',
    '/ai-service/general/health',
  ],
  prefix: [
    // 可以添加路径前缀，例如所有 /public/* 路径
    // '/ai-service/public',
  ],
  regex: [
    // 可以添加正则表达式，例如所有 health 检查接口
    // /\/health$/,
  ],
};

/**
 * 检查路径是否在白名单中
 */
export function isWhitelisted(
  path: string,
  config: WhitelistConfig = DEFAULT_WHITELIST,
): boolean {
  // 移除查询参数
  const cleanPath = path.split('?')[0];

  // 检查精确匹配
  if (config.exact?.some((p) => p === cleanPath)) {
    return true;
  }

  // 检查前缀匹配
  if (config.prefix?.some((p) => cleanPath.startsWith(p))) {
    return true;
  }

  // 检查正则表达式匹配
  if (config.regex?.some((regex) => regex.test(cleanPath))) {
    return true;
  }

  return false;
}
