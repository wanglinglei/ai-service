import * as fs from 'fs';
import * as mammoth from 'mammoth';
import { join } from 'path';

/**
 * 用 mammoth 解析 DOCX 中的占位符字段
 * @param filePath DOCX 文件路径
 * @returns 去重后的字段数组
 */
export async function parseDocxWithMammoth(
  filePath: string,
): Promise<string[]> {
  // 1. 将 DOCX 转为纯文本
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value; // 提取的纯文本内容
  // 2. 提取 {xxx} 格式的字段
  const regex = /\{([\w.]+)\}/g;
  const matches = text.match(regex);
  if (!matches) return [];

  // 3. 去重处理
  const fields = new Set(matches.map((match) => match.replace(/[{}]/g, '')));
  return Array.from(fields);
}

/**
 * 安全删除文件
 */
export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ 已删除临时文件: ${filePath}`);
    } else {
      console.warn(`⚠️ 文件不存在，跳过删除: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ 删除文件失败: ${filePath}`, err);
    // 不抛出错误，避免影响主流程
  }
}
