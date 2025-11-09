import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { parseDocxWithMammoth, cleanupFile } from './utils/docxParser';
import { serviceController } from 'src/services';
import * as mammoth from 'mammoth';

@Injectable()
export class DocxProcessService {
  private readonly logger = new Logger(DocxProcessService.name);
  async processData(
    rawFile: Express.Multer.File,
    templateJson: string,
  ): Promise<any> {
    // 使用 buffer 而不是文件路径，避免文件系统权限问题
    if (!rawFile.buffer) {
      throw new BadRequestException('文件数据不可用');
    }
    const rawText = await mammoth.extractRawText({ buffer: rawFile.buffer });
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
    - 每匹配到一个完整数据,就作为数组中的一个元素，不要合并多个数据为一个元素.例如：模板数据为：{name: '', age: ''},原始文档内容为：姓名：张三，年龄：18， 则返回的JSON数据为：[{name: 张三,age:18}]
    - 如果某字段未找到，对应值为空字符串 ""
    - 不要添加额外说明
    -必须返回一个可直接解析的JSON数据,不要出现'/\`\`\`/'
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
    }
    // 使用内存存储，无需清理文件
  }
}
