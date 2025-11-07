/**
 * 错误码常量配置
 * 用于前端统一处理异常场景
 * 仅包含认证相关和权限相关的错误码
 */

export enum ErrorCode {
  // 认证相关错误 (401)
  /** 未登录 */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** Token 已过期 */
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  /** Token 无效 */
  TOKEN_INVALID = 'TOKEN_INVALID',
  /** 用户不存在 */
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  /** 账户已被禁用 */
  USER_DISABLED = 'USER_DISABLED',

  // 权限相关错误 (403)
  /** 权限不足 */
  FORBIDDEN = 'FORBIDDEN',
  /** 功能权限不足 */
  FEATURE_PERMISSION_DENIED = 'FEATURE_PERMISSION_DENIED',
}

/**
 * 错误码与 HTTP 状态码的映射关系
 */
export const ERROR_CODE_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.USER_NOT_FOUND]: 401,
  [ErrorCode.USER_DISABLED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.FEATURE_PERMISSION_DENIED]: 403,
};
