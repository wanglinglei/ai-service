import { Injectable, BadRequestException } from '@nestjs/common';
import { parseDocxWithMammoth, cleanupFile } from './utils/docxParser';
import { serviceController } from 'src/services';
import * as mammoth from 'mammoth';

@Injectable()
export class DocxProcessService {
  async processData(
    rawFile: Express.Multer.File,
    templateJson: string,
  ): Promise<any> {
    const rawText = await mammoth.extractRawText({ path: rawFile.path });
    const prompt = `
    请从以下原始文档中提取以下字段的信息：
    **字段列表**：
    ${templateJson}
    **原始文档内容**：
    \`\`\`
    ${rawText.value}
    \`\`\`

    **要求**：
    - 返回一个数组结构的 JSON 对象，数组中每个元素的结构为：{ field: value }，字段名严格匹配
    - 每匹配到一个完整数据,就作为数组中的一个元素，不要合并多个数据为一个元素
    - 如果某字段未找到，对应值为空字符串 ""
    - 不要添加额外说明
    `;
    const body = {
      model: 'qwen-max',
      messages: [
        {
          role: 'system',
          content:
            '你是一个专业的文档解析专家，请从以下原始文档中提取以下字段的信息：',
        },
        { role: 'user', content: prompt },
      ],
    };

    try {
      const response = await serviceController.executeService(
        'chat',
        'chat_ty',
        body,
      );

      const data = JSON.parse(response.content);
      return data;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : '文档解析失败',
      );
    } finally {
      cleanupFile(rawFile.path);
    }
  }
}
