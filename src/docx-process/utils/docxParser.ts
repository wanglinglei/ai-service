import * as fs from 'fs';
import * as mammoth from 'mammoth';

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
